#erreur non couvert par tryconstrain 

Invalid `prisma.programUE.updateMany()` invocation: Unique constraint failed on the fields: (`"programId"`, `semester`, `"order"`)

Invalid `prisma.$queryRaw()` invocation: Raw query failed. Code: `42883`. Message: `function teacher_check_in(uuid, double precision, double precision, text) does not exist`


// au demarage de session
Invalid `prisma.$queryRaw()` invocation: Raw query failed. Code: `23502`. Message: `null value in column "updatedAt" of relation "Session" violates not-null constraint`


## Error Type
Runtime PrismaClientKnownRequestError

## Error Message
Transaction API error: Unable to start a transaction in the given time.




Transaction API error: Unable to start a transaction in the given time.

    at  tryConstraint (src\utils\server\prisma.ts:64:12)
    at  createPersonalClass (src\features\personal\services\class\database\class.mutations.ts:81:18)
    at  createPersonalClassAction (src\features\personal\services\class\actions\class.mutations.ts:17:18)
    at <anonymous> (src\utils\server\form\action.ts:79:17)
    at form (<anonymous>:null:null)
    at CreateClassModal (src\components\personal\teacher\class\CreateClassModal.tsx:199:7)
    at <anonymous> (src\app\(app)\personal\[slug]\teacher\classes\page.tsx:113:15)
    at Array.map (<anonymous>:1:18)
    at PersonalTeacherClassesPage (src\app\(app)\personal\[slug]\teacher\classes\page.tsx:112:29)

## Code Frame
  62 | export async function tryConstraint<T>(promise: Promise<T>): Promise<T> {
  63 |   try {
> 64 |     return await promise
     |            ^
  65 |   } catch (error) {
  66 |     // Panne d'infra (base injoignable) : à traiter AVANT tryTriggerError
  67 |     // (qui fait un .includes() sur le message — pas concerné ici mais on

Next.js version: 16.2.10 (Turbopack)

Runtime PrismaClientKnownRequestError
Server



Invalid `tx.programTrack.upsert()` invocation in
C:\PROJECTS\PROJECT\PRODUCTIONS\attendancy\apps\web\.next\dev\server\chunks\ssr\[root-of-the-server]__0v-ixs4._.js:5086:48

  5083         id: true
  5084     }
  5085 });
→ 5086 const programTrack = await tx.programTrack.upsert(
Transaction API error: A query cannot be executed on an expired transaction. The timeout for this transaction was 5000 ms, however 8890 ms passed since the start of the transaction. Consider increasing the interactive transaction timeout or doing less work in the transaction.


Invalid `prisma.programTrack.create()` invocation: { data: { name: "genie logiciel", departmentId: null, orgId: "33843a2f-78b7-4fc4-aafd-d7a40943e2b1", + department: { + create: DepartmentCreateWithoutProgramTracksInput | DepartmentUncheckedCreateWithoutProgramTracksInput, + connectOrCreate: DepartmentCreateOrConnectWithoutProgramTracksInput, + connect: DepartmentWhereUniqueInput + } }, select: { id: true, name: true, departmentId: true, description: true } } Argument `department` is missing.