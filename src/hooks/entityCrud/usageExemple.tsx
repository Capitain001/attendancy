// usageExemple.tsx
import { useCrudEntity, Payload } from "./useCrudEntity";
import { Teacher } from "./types";

export default function Exemple() {
  // Hook pour teachers
  const { data: teachers, applyPayload } = useCrudEntity<Teacher>({
    entityName: "teachers",
    fetchFn: async () => [
      { id: "1", name: "Alice", email: "alice@example.com" },
      { id: "2", name: "Bob", email: "bob@example.com" },
    ],
    revalidateMode: "patch",
  });

  // Payload mock
  const payload: Payload<Teacher> = {
    type: "UPDATE",
    record: { id: "1", name: "Alice fuck", email: "alice.new@example.com" },
    old_record: { id: "1", name: "Alice", email: "alice@example.com" },
  };

  const handleUpdate = () => {
    applyPayload(payload);
  };

  return (
    <div>
      <button onClick={handleUpdate}>Appliquer update</button>
      <ul>
        {teachers.map((t) => (
          <li key={t.id}>{t.name}</li>
        ))}
      </ul>
    </div>
  );
}
