en suivant le formalisme de :
apps\web\src\components\users\settings\ProfileTabContent.tsx

cree un tab setting "worksapace"
il permet a l user de voir son org curent et de le renommer , changer le logo ect ...

ne l affiche a l user que si org.Type ="PERSONAL"

- reutilise : updateOrgIdentityAction : apps\web\src\services\organization\actions\organization.mutations.ts
servcice : apps\web\src\services\organization\actions\

inspire toi de l existant pr l administration : apps\web\src\components\auth\org\OrgSetupForm.tsx

en restant dans le theme visuel de ProfileTabContent