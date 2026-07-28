// src/hooks/entity/_exemples/useCrudEntity-Exemple.tsx
//@ts-nocheck

import { useCrudEntity } from "../useCrudEntity";

// ✅ Même API que useEntity
const { data:mydata, loading } = useCrudEntity({
    entityName: "departments",
    fetchFn: () => fetch("/api/departments").then(r => r.json())
  });


//   import { createDepartment, updateDepartment, deleteDepartment } from "@/actions/departments";

export async function  fetchDepartments  (){
    return []
}

export async function  createDepartment (){
    
}

export async function  updateDepartment (id:string, data:object){
    
}

/**
 * Supprime un département de la base de données
 * @param id - Identifiant du département à supprimer
 * @returns L'identifiant du département supprimé
 */
export async function  deleteDepartment (id:string): Promise<void>{
    // Suppression logique
    return;
}

// ✅ Configuration du hook : on passe la FONCTION (pas l'appel)
const { create, update, delete: deleteDept } = useCrudEntity({
  entityName: "departments",
  fetchFn: fetchDepartments,
  crud: {
    // ✅ Server Actions fonctionnent parfaitement
    create: createDepartment,
    update: (id, data) => updateDepartment(id, data),
    delete: deleteDepartment // ✅ Passer la fonction, pas l'appel
  }
});

// ✅ Utilisation : l'id est passé lors de l'appel
const id = "1";
const data = { name: "Nouveau département" };

// Supprimer un élément par son id
deleteDept(id); // ✅ Appelle deleteDepartment(id) via la mutation React Query

// Créer un élément
create(data); // ✅ Appelle createDepartment(data)

// Mettre à jour un élément
update({ id, data }); // ✅ Appelle updateDepartment(id, data)


// ============================================
// EXEMPLES D'USAGE VARIÉS
// ============================================

// 📝 Exemple 1 : Hook avec gestion des états de chargement et erreurs
export function ExampleWithStates() {
  const { 
    data: departments, 
    loading, 
    create, 
    update, 
    delete: deleteDept,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError
  } = useCrudEntity({
    entityName: "departments",
    fetchFn: fetchDepartments,
    crud: {
      create: createDepartment,
      update: (id, data) => updateDepartment(id, data),
      delete: deleteDepartment,
      messages: {
        create: "Département créé avec succès",
        update: "Département modifié",
        delete: "Département supprimé"
      }
    }
  });

  const handleCreate = async () => {
    try {
      await create({ name: "IT" });
    } catch (error) {
      console.error("Erreur création:", error);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await update({ id, data: { name: "IT Updated" } });
    } catch (error) {
      console.error("Erreur mise à jour:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDept(id);
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (createError) return <div>Erreur: {createError.message}</div>;

  return (
    <div>
      <button onClick={handleCreate} disabled={isCreating}>
        {isCreating ? "Création..." : "Créer"}
      </button>
      {departments.items.map((dept) => (
        <div key={dept.id}>
          {dept.name}
          <button onClick={() => handleUpdate(dept.id)} disabled={isUpdating}>
            Modifier
          </button>
          <button onClick={() => handleDelete(dept.id)} disabled={isDeleting}>
            Supprimer
          </button>
        </div>
      ))}
    </div>
  );
}

// 📝 Exemple 2 : Hook avec messages personnalisés
export function ExampleWithCustomMessages() {
  const { create, update, delete: deleteDept } = useCrudEntity({
    entityName: "departments",
    fetchFn: fetchDepartments,
    crud: {
      create: createDepartment,
      update: (id, data) => updateDepartment(id, data),
      delete: deleteDepartment,
      messages: {
        create: "✅ Département créé !",
        update: "✅ Département mis à jour !",
        delete: "🗑️ Département supprimé !",
        error: "❌ Une erreur est survenue"
      }
    }
  });

  return null; // Composant exemple
}

// 📝 Exemple 3 : Hook avec seulement READ (sans CRUD)
export function ExampleReadOnly() {
  const { data, loading, error, refetch } = useCrudEntity({
    entityName: "departments",
    fetchFn: fetchDepartments,
    // Pas de crud configuré = mode lecture seule
  });

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div>
      <button onClick={() => refetch()}>Actualiser</button>
      {data.items.map((dept) => (
        <div key={dept.id}>{dept.name}</div>
      ))}
    </div>
  );
}

// 📝 Exemple 4 : Hook avec seulement CREATE et DELETE (pas d'UPDATE)
export function ExampleCreateDeleteOnly() {
  const { data, create, delete: deleteDept, isCreating, isDeleting } = useCrudEntity({
    entityName: "departments",
    fetchFn: fetchDepartments,
    crud: {
      create: createDepartment,
      delete: deleteDepartment,
      // Pas de update = seulement create et delete disponibles
    }
  });

  return (
    <div>
      <button onClick={() => create({ name: "Nouveau" })} disabled={isCreating}>
        Créer
      </button>
      {data.items.map((dept) => (
        <div key={dept.id}>
          {dept.name}
          <button onClick={() => deleteDept(dept.id)} disabled={isDeleting}>
            Supprimer
          </button>
        </div>
      ))}
    </div>
  );
}

// 📝 Exemple 5 : Hook avec async/await et gestion d'erreurs dans un composant
export function ExampleWithAsyncAwait() {
  const { create, update, delete: deleteDept } = useCrudEntity({
    entityName: "departments",
    fetchFn: fetchDepartments,
    crud: {
      create: createDepartment,
      update: (id, data) => updateDepartment(id, data),
      delete: deleteDepartment
    }
  });

  const handleCrudOperations = async () => {
    try {
      // Créer
      const newDept = await create({ name: "IT" });
      console.log("Créé:", newDept);

      // Mettre à jour
      const updated = await update({ id: newDept.id, data: { name: "IT Updated" } });
      console.log("Mis à jour:", updated);

      // Supprimer
      await deleteDept(newDept.id);
      console.log("Supprimé");
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  return <button onClick={handleCrudOperations}>Exécuter CRUD</button>;
}

// 📝 Exemple 6 : Hook avec transformation des données
export function ExampleWithTransform() {
  const { data } = useCrudEntity({
    entityName: "departments",
    fetchFn: fetchDepartments,
    transformFn: (items) => items.filter(item => item.name.startsWith("IT")),
    crud: {
      create: createDepartment,
      update: (id, data) => updateDepartment(id, data),
      delete: deleteDepartment
    }
  });

  // data contient uniquement les départements commençant par "IT"
  return <div>{data.items.map(d => d.name)}</div>;
}
