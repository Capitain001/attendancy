//packages\chat\tests\relay.e2e.test.ts
import WebSocket from "ws";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createChatSync,
  createInbox,
  createLanTransport,
  createOutbox,
  memoryStore,
  type OutboxItem,
  type WebSocketCtor,
} from "../src";
import { createRelayHost, RelayHostError, type RelayHost } from "../src/relay-host";

const WS = WebSocket as unknown as WebSocketCtor;
const TEST_CHANNEL = "11111111-1111-4111-8111-111111111111";

const hub = createRelayHost();
let url = "";

beforeAll(async () => {
  url = (await hub.start({ token: "tok" })).url;
});
afterAll(() => hub.stop());

async function waitFor(cond: () => Promise<boolean> | boolean, ms = 4000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await cond()) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error("waitFor: délai dépassé");
}

async function startOn(host: RelayHost, port: number) {
  for (let i = 0; ; i++) {
    try {
      return await host.start({ token: "tok", port });
    } catch (e) {
      const busy = e instanceof RelayHostError && e.code === "PortInUse";
      if (!busy || i >= 2) throw e;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

function client(userId: string, token = "tok") {
  const outbox = createOutbox({ store: memoryStore<OutboxItem>(), userId });
  const inbox = createInbox({ store: memoryStore() });
  let online = false;
  const lan = createLanTransport({
    url,
    token,
    userId,
    name: userId,
    channels: [TEST_CHANNEL],
    WebSocketImpl: WS,
    known: () => inbox.knownIds([TEST_CHANNEL]),
    backoff: { minMs: 50, maxMs: 200 },
  });
  const server: string[] = [];
  const sync = createChatSync({
    userId,
    userName: userId,
    outbox,
    inbox,
    transports: [lan],
    sendToServer: async (i) => {
      if (!online) throw new TypeError("offline");
      server.push(i.id);
      return { data: 1 };
    },
  });
  return { sync, outbox, inbox, lan, server, goOnline: () => (online = true) };
}

describe("chat de bout en bout (relais Rust réel)", () => {
  it("écrit sans réseau, part au hub à la connexion, arrive chez le pair, puis le serveur confirme", async () => {
    const a = client("alice");
    const b = client("bob");

    // alice écrit AVANT d'être connectée à quoi que ce soit
    const item = await a.sync.send({
      channelId: TEST_CHANNEL,
      content: "cours déplacé en B12",
    });
    expect((await a.outbox.list())[0]?.status).toBe("pending");

    b.sync.start();
    await waitFor(() => b.lan.status() === "connected");
    a.sync.start();

    // reconnexion d'alice => renvoi automatique de ses messages en attente
    await waitFor(async () => (await b.inbox.list()).length === 1);
    const got = (await b.inbox.list())[0]!;
    expect(got).toMatchObject({
      id: item!.id,
      authorId: "alice",
      content: "cours déplacé en B12",
    });

    // alice est toujours en attente côté serveur (le hub n'est pas la vérité)
    expect(await a.outbox.list()).toHaveLength(1);

    // internet revient chez alice : l'outbox part, une seule fois
    a.goOnline();
    await a.sync.flush();
    expect(a.server).toEqual([item!.id]);
    expect(await a.outbox.list()).toEqual([]);

    // bob reçoit la version serveur : la copie "non vérifiée" disparaît
    await b.sync.confirm([item!.id]);
    expect(await b.inbox.list()).toEqual([]);

    a.sync.stop();
    b.sync.stop();
  });

  it("un arrivant tardif reçoit l'historique, sans doublon avec ce qu'il connaît", async () => {
    const a = client("alice2");
    a.sync.start();
    await waitFor(() => a.lan.status() === "connected");
    await a.sync.send({ channelId: TEST_CHANNEL, content: "m1" });
    await a.sync.send({ channelId: TEST_CHANNEL, content: "m2" });

    const late = client("carol");
    late.sync.start();
    await waitFor(async () => (await late.inbox.list()).length >= 2);
    const ids = (await late.inbox.list()).map((e) => e.content);
    expect(ids).toEqual(expect.arrayContaining(["m1", "m2"]));
    expect(new Set(ids).size).toBe(ids.length);

    a.sync.stop();
    late.sync.stop();
  });

  it("mauvais jeton : jamais connecté, pas de boucle de reconnexion", async () => {
    const bad = client("eve", "faux");
    bad.sync.start();
    await waitFor(() => bad.lan.status() === "closed");
    await new Promise((r) => setTimeout(r, 400));
    expect(bad.lan.status()).toBe("closed");
    bad.sync.stop();
  });

  it("le hub tombe puis revient : reconnexion automatique et renvoi des messages en attente", async () => {
    const host = createRelayHost();
    const first = await host.start({ token: "tok" });
    const saved = url;
    url = first.url;
    const a = client("dave");
    const watcher = client("erin");
    a.sync.start();
    watcher.sync.start();
    await waitFor(
      () =>
        a.lan.status() === "connected" && watcher.lan.status() === "connected",
    );

    await host.stop();
    await waitFor(() => a.lan.status() !== "connected");
    await a.sync.send({ channelId: TEST_CHANNEL, content: "écrit pendant la coupure" });

    await startOn(host, first.port);
    await waitFor(
      () =>
        a.lan.status() === "connected" && watcher.lan.status() === "connected",
    );
    await waitFor(async () =>
      (await watcher.inbox.list()).some(
        (e) => e.content === "écrit pendant la coupure",
      ),
    );

    a.sync.stop();
    watcher.sync.stop();
    await host.stop();
    url = saved;
  });
});
