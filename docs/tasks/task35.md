https://claude.ai/share/09c5c1b2-593c-4430-b0b4-1396f375a7f3

contexte: app web (source api (rpc) on veux cree les interface desktop (frontend))


objectif : on cherche a preproduire l application web dans apps\desktop\src\

notament en partagean l ui partageable et en adaptant les elements necessaires 


nous parton d un point de vu teacher :
-apps\web\src\app\(app)\personal\[slug]\teacher\page.tsx
puis apres:
-apps\web\src\app\(app)\[slug]\teacher\page.tsx

NB: le contenu des page metier ne concerne pas cette tache inutile de les lire 

nous nous interesson plto au schell de l application 

les layout , provider , etting , ect 

le shell represente l enssemble des element reutiliser quelque soi l utilisateur et ne vie generalement pas dans la route user (teacher, students)

notre tache est de definir un plan  implementation de ses element  dans desktop

decoupe la tache en phase et micro tache nommer slots
en creant un dossier nommer task35/ contenant ses micro elements numeroter par ordre d implementation 

chaque slot peut avoir un fichier slotx.def.md qui reppresente les defi techique et les points a trancher 

ce fichier n est a cree que sur la tache curent , donc par defaut uniquement pr les taches de la phase 1

n hesite pas a lire les pakage et leur usage actuelle pr comprendre le contexte technque 

le routage :

apps/desktop/src/routes/
├── __root.tsx
├── index.tsx                          → redirect vers /personal ou /auth/login
├── auth/
│   ├── route.tsx                      → garde : déjà connecté → /personal
│   ├── login.tsx
│   ├── signup.tsx
│   └── ...                            (autres pages auth : forgot-password, etc.)
└── _app/
    ├── route.tsx                      → garde : non connecté → /auth/login + shell
    └── personal/
        └── $slug/
            ├── route.tsx              → layout du slug (optionnel)
            ├── teacher.tsx
            └── ...                    (students.tsx, schedules/, etc.)
        $slug simple aussi sans personal


Le numéro de série du volume est B01D-0BCF
C:.
│   globals copy.md
│   globals.css
│   layout.tsx
│   page.tsx
│   
├───(app)
│   │   structure.md
│   │   
│   ├───personal
│   │   └───[slug]
│   │       └───teacher
│   │           │   layout.tsx
│   │           │   page.old.md
│   │           │   page.tsx
│   │           │   
│   │           ├───attendance
│   │           │       page.tsx
│   │           │       
│   │           ├───classes
│   │           │   │   page.tsx
│   │           │   │   
│   │           │   └───[id]
│   │           │           page.tsx
│   │           │           
│   │           ├───courses
│   │           │   │   page.tsx
│   │           │   │   
│   │           │   ├───new
│   │           │   │       page.tsx
│   │           │   │       
│   │           │   └───[id]
│   │           ├───notifications
│   │           │       page.tsx
│   │           │       
│   │           ├───planning
│   │           │       page.tsx
│   │           │       
│   │           ├───sessions
│   │           │       page.tsx
│   │           │       
│   │           ├───start
│   │           │       page.tsx
│   │           │       
│   │           ├───students
│   │           │       page.tsx
│   │           │       
│   │           └───unavailabilities
│   │                   page.tsx
│   │                   
│   ├───session
│   │   └───attendance
│   │           page.tsx
│   │           
│   ├───subscription
│   │   │   page.tsx
│   │   │   
│   │   ├───cancel
│   │   │       page.tsx
│   │   │       
│   │   └───success
│   │           page.tsx
│   │           
│   └───[slug]
│       │   layout.tsx
│       │   
│       ├───admin
│       │   └───functions
│       │           page.tsx
│       │           
│       ├───direction
│       │   │   layout.tsx
│       │   │   loading.tsx
│       │   │   page.tsx
│       │   │   
│       │   ├───academic
│       │   │   │   layout.tsx
│       │   │   │   
│       │   │   ├───courses
│       │   │   │   │   page.tsx
│       │   │   │   │   
│       │   │   │   └───[courseId]
│       │   │   │           page.tsx
│       │   │   │           
│       │   │   ├───departments
│       │   │   │       page.tsx
│       │   │   │       
│       │   │   ├───program-tracks
│       │   │   │       page.tsx
│       │   │   │       
│       │   │   ├───programs
│       │   │   │   │   page.tsx
│       │   │   │   │   
│       │   │   │   └───[programId]
│       │   │   │           page.tsx
│       │   │   │           
│       │   │   ├───promotions
│       │   │   │   │   layout.tsx
│       │   │   │   │   page.tsx
│       │   │   │   │   
│       │   │   │   └───[classId]
│       │   │   │       │   layout.tsx
│       │   │   │       │   page.tsx
│       │   │   │       │   
│       │   │   │       ├───courses
│       │   │   │       │       page.tsx
│       │   │   │       │       
│       │   │   │       ├───enrollment
│       │   │   │       │       page.tsx
│       │   │   │       │       
│       │   │   │       ├───groups
│       │   │   │       │       page.tsx
│       │   │   │       │       
│       │   │   │       ├───invitations
│       │   │   │       │       page.tsx
│       │   │   │       │       
│       │   │   │       └───program
│       │   │   │           │   layout.tsx
│       │   │   │           │   page.tsx
│       │   │   │           │   
│       │   │   │           ├───@modal
│       │   │   │           │       default.tsx
│       │   │   │           │       page.tsx
│       │   │   │           │       
│       │   │   │           └───@program_modal
│       │   │   │                   default.tsx
│       │   │   │                   loading.tsx
│       │   │   │                   page.tsx
│       │   │   │                   
│       │   │   ├───ues
│       │   │   │   │   loading.tsx
│       │   │   │   │   page.tsx
│       │   │   │   │   
│       │   │   │   ├───templates
│       │   │   │   │   │   page.tsx
│       │   │   │   │   │   
│       │   │   │   │   └───[id]
│       │   │   │   │           page.tsx
│       │   │   │   │           
│       │   │   │   └───[ueId]
│       │   │   │           page.tsx
│       │   │   │           
│       │   │   └───years
│       │   │           page.tsx
│       │   │           
│       │   ├───administration
│       │   │   ├───audit
│       │   │   │       page.tsx
│       │   │   │       
│       │   │   └───settings
│       │   │           page.tsx
│       │   │           
│       │   ├───attendance
│       │   │   ├───reports
│       │   │   │       page.tsx
│       │   │   │       
│       │   │   └───sessions
│       │   │           page.tsx
│       │   │           
│       │   ├───evaluation
│       │   │       page.tsx
│       │   │       
│       │   ├───functions
│       │   │   │   page.tsx
│       │   │   │   
│       │   │   └───[id]
│       │   │           page.tsx
│       │   │           
│       │   ├───invitations
│       │   │   │   page.tsx
│       │   │   │   
│       │   │   └───teachers
│       │   │           page.tsx
│       │   │           
│       │   ├───notifications
│       │   │   │   page.tsx
│       │   │   │   
│       │   │   └───schedules
│       │   │           page.tsx
│       │   │           
│       │   ├───people
│       │   │   ├───parents
│       │   │   │       page.tsx
│       │   │   │       
│       │   │   ├───students
│       │   │   │   │   page.tsx
│       │   │   │   │   
│       │   │   │   └───[studentId]
│       │   │   │           page.tsx
│       │   │   │           
│       │   │   └───teachers
│       │   │       │   page.tsx
│       │   │       │   
│       │   │       └───[teacherId]
│       │   │               page.tsx
│       │   │               
│       │   ├───planning
│       │   │   ├───classe
│       │   │   │   └───[classId]
│       │   │   │           page.tsx
│       │   │   │           
│       │   │   └───promotion
│       │   │       └───[classId]
│       │   │               page.tsx
│       │   │               
│       │   ├───reports
│       │   │       page.tsx
│       │   │       
│       │   ├───schedule
│       │   │   │   page.tsx
│       │   │   │   
│       │   │   ├───calendar
│       │   │   │       page.tsx
│       │   │   │       
│       │   │   ├───events
│       │   │   │       page.tsx
│       │   │   │       
│       │   │   └───rooms
│       │   │           page.tsx
│       │   │           
│       │   └───sessions
│       │           page.tsx
│       │           
│       ├───profile
│       │       page.tsx
│       │       
│       ├───settings
│       │   │   layout.tsx
│       │   │   page.tsx
│       │   │   
│       │   ├───devices
│       │   │       DeviceLabelInput.tsx
│       │   │       DeviceRevokeButton.tsx
│       │   │       DeviceTrustToggle.tsx
│       │   │       page.tsx
│       │   │       
│       │   ├───notifications
│       │   │       page.tsx
│       │   │       
│       │   ├───payment
│       │   │       page.tsx
│       │   │       
│       │   ├───plugins
│       │   │       page.tsx
│       │   │       
│       │   ├───privacy
│       │   │       page.tsx
│       │   │       
│       │   ├───profile
│       │   │       page.tsx
│       │   │       
│       │   ├───theme
│       │   │       AppearanceSection.tsx
│       │   │       page.tsx
│       │   │       
│       │   ├───time
│       │   │       page.tsx
│       │   │       
│       │   └───workspace
│       │           page.tsx
│       │           
│       ├───student
│       │   │   layout.tsx
│       │   │   page.tsx
│       │   │   
│       │   ├───attendance
│       │   │       page.tsx
│       │   │       
│       │   ├───grades
│       │   │       page.tsx
│       │   │       
│       │   ├───notifications
│       │   │       page.tsx
│       │   │       
│       │   ├───planning
│       │   │       page.tsx
│       │   │       
│       │   └───session
│       │           page.tsx
│       │           
│       └───teacher
│           │   layout.tsx
│           │   old-page.md
│           │   page.tsx
│           │   TeacherDailyTimeline.tsx
│           │   
│           ├───attendance
│           │       fix copy.md
│           │       fix.md
│           │       page copy.tsx
│           │       page.tsx
│           │       pages.save.md
│           │       pr_sentation_du_projet_nexus_trading_intelligence.md
│           │       
│           ├───courses
│           │   │   page.tsx
│           │   │   
│           │   └───[id]
│           │       │   page.tsx
│           │       │   
│           │       └───evaluations
│           │               page.tsx
│           │               
│           ├───evaluations
│           │       page.tsx
│           │       
│           ├───notifications
│           │       page.tsx
│           │       
│           ├───planning
│           │       page.tsx
│           │       
│           ├───sessions
│           │       page.tsx
│           │       
│           ├───students
│           │       page.tsx
│           │       StudentFilter.tsx
│           │       TeacherStudents.tsx
│           │       
│           ├───test
│           │       page.tsx
│           │       swiper.test.md
│           │       
│           └───unavailabilities
│                   page.tsx
│                   
├───admin
│   │   layout.tsx
│   │   page.tsx
│   │   
│   └───seed
│           page.tsx
│           
├───api
│   ├───auth
│   │   └───me
│   │           route.ts
│   │           
│   ├───classes
│   │   └───dev
│   │           route.ts
│   │           
│   ├───rpc
│   │   └───[action]
│   │           route.ts
│   │           
│   └───teacher
│       └───schedule-days
│               route.ts
│               
├───auth
│   │   layout.tsx
│   │   
│   ├───callback
│   │       route.ts
│   │       
│   ├───check-email
│   │       page.tsx
│   │       
│   ├───error
│   │       page.tsx
│   │       
│   ├───forgot-password
│   │       page.tsx
│   │       
│   ├───invite
│   │       page.tsx
│   │       
│   ├───link-expired
│   │       page.tsx
│   │       
│   ├───org
│   │   ├───info
│   │   │       page.tsx
│   │   │       
│   │   ├───profile
│   │   │       page.tsx
│   │   │       
│   │   └───setup
│   │           page.tsx
│   │           
│   ├───profile
│   │       page.tsx
│   │       
│   ├───redirect
│   │       page.ts
│   │       
│   ├───signup
│   │   │   page.tsx
│   │   │   
│   │   ├───personal
│   │   │       page.tsx
│   │   │       test.md
│   │   │       
│   │   └───principal
│   │           page.tsx
│   │           
│   └───welcome
│           page.tsx
│           
├───login
│       page.tsx
│       
├───playground
│       page.tsx
│       
└───test
    │   page.tsx
    │   
    ├───chat
    │       page.tsx
    │       
    ├───dnd
    │       NoiseExemple.tsx
    │       page.tsx
    │       
    ├───invitation
    │       page.tsx
    │       
    ├───modal
    │   │   layout.tsx
    │   │   page.tsx
    │   │   
    │   └───@modal
    │           default.tsx
    │           page.tsx
    │           
    ├───notif
    │       page.tsx
    │       
    ├───promotion-courses
    │       CoursesExample.tsx
    │       page.tsx
    │       
    ├───students
    │   └───table
    │           page.tsx
    │           
    ├───ux
    │       page.tsx
    │       
    └───welcome
            page.tsx
            
PS C:\PROJECTS\PROJECT\PRODUCTIONS\attendancy\apps\web\src\app> 
