import React from 'react';

/**
 * Composant AnimatedTextSVG - Affiche du texte animé le long d'un chemin SVG
 * 
 * Ce composant crée un effet de texte qui se déplace le long d'un chemin SVG défini,
 * avec possibilité de mettre en surbrillance certains mots.
 * 
 * @param text - Le texte à afficher (répété pour remplir le chemin)
 * @param highlightText - Texte à mettre en surbrillance (optionnel)
 * @param animationDuration - Durée de l'animation en secondes
 * @param fontSize - Taille de la police (non utilisée actuellement)
 */
export const AnimatedTextSVG = ({ 
  text = "PIRI PIRI CHICKEN",
  highlightText = "",
  animationDuration = 12,
  fontSize = 20
}) => {
  // Génère un ID unique pour éviter les conflits entre plusieurs instances du composant
  // Utilise Math.random() pour créer un identifiant unique à chaque rendu
  const pathId = `wavepath-${Math.random().toString(36).substr(2, 9)}`;
  
  // Répète le texte 6 fois pour remplir complètement le chemin SVG
  // Les espaces entre chaque répétition permettent une séparation visuelle
  const repeatedText = Array(6).fill(text).join(' ');

  return (
    // Conteneur principal avec affichage inline-block pour s'intégrer au flux du texte
    <div className="inline-block">
      {/* 
        SVG principal avec dimensions fixes et viewBox pour le responsive
        - width/height: 301px (dimensions fixes)
        - viewBox: définit la zone de coordonnées SVG
        - overflow-visible: permet au contenu de déborder si nécessaire
      */}
      <svg 
        className="w-auto h-auto overflow-visible block" 
        xmlns="http://www.w3.org/2000/svg" 
        width="301" 
        height="301" 
        viewBox="0 0 301 301"
      >
        {/* 
          Chemin SVG invisible qui définit la trajectoire du texte
          - fill: transparent (pas de remplissage)
          - stroke: transparent (pas de contour visible)
          - stroke-width: 1px (épaisseur minimale pour le chemin)
          - d: attribut path complexe définissant la forme (rectangle avec répétitions)
        */}
        <path 
          id={pathId} 
          className="fill-transparent stroke-transparent stroke-[1px]"
          d="M145.5 301.5H13C6.09645 301.5 0.5 295.904 0.5 289V13C0.5 6.09645 6.09644 0.5 13 0.5H289C295.904 0.5 301.5 6.09644 301.5 13V289C301.5 295.904 295.904 301.5 289 301.5H156.5 H13C6.09645 301.5 0.5 295.904 0.5 289V13C0.5 6.09645 6.09644 0.5 13 0.5H289C295.904 0.5 301.5 6.09644 301.5 13V289C301.5 295.904 295.904 301.5 289 301.5H156.5 H13C6.09645 301.5 0.5 295.904 0.5 289V13C0.5 6.09645 6.09644 0.5 13 0.5H289C295.904 0.5 301.5 6.09644 301.5 13V289C301.5 295.904 295.904 301.5 289 301.5H156.5 H13C6.09645 301.5 0.5 295.904 0.5 289V13C0.5 6.09645 6.09644 0.5 13 0.5H289C295.904 0.5 301.5 6.09644 301.5 13V289C301.5 295.904 295.904 301.5 289 301.5H156.5 H13C6.09645 301.5 0.5 295.904 0.5 289V13C0.5 6.09645 6.09644 0.5 13 0.5H289C295.904 0.5 301.5 6.09644 301.5 13V289C301.5 295.904 295.904 301.5 289 301.5H156.5 H13C6.09645 301.5 0.5 295.904 0.5 289V13C0.5 6.09645 6.09644 0.5 13 0.5H289C295.904 0.5 301.5 6.09644 301.5 13V289C301.5 295.904 295.904 301.5 289 301.5H156.5"
        />

        {/* 
          Zone pour insérer du contenu HTML dans le SVG
          - x, y: position dans le SVG (6px depuis le bord)
          - width, height: dimensions de la zone (300px)
          - Contient un div avec une bordure blanche et un fond
        */}
        <foreignObject x='6' y='6' width='300px' height='300px'>
          <div className="w-[282px] h-[282px] rounded-lg bg-contain border-4 border-white inline-block" />
        </foreignObject>

        {/* 
          Élément texte qui suit le chemin SVG défini
          - textAnchor="left": aligne le texte à gauche du chemin
          - Classes Tailwind: uppercase, font-sans, text-white, text-[20px]
        */}
        <text className="uppercase font-sans text text-[20px]" >
          {/* 
            textPath fait suivre le texte le long du chemin SVG référencé
            - href: référence l'ID du chemin (#pathId)
            - startOffset: position de départ (0% = début du chemin)
            - textLength: longueur totale du texte pour l'animation
          */}
          <textPath 
            className="fill-opacity-100 "
            href={`#${pathId}`} 
            startOffset="0%" 
            textLength="1175"
          >
            {/* 
              Animation SVG qui déplace le texte le long du chemin
              - attributeName="startOffset": anime la position de départ
              - from="0%": commence au début du chemin
              - to="37.58%": se termine à 37.58% du chemin
              - dur: durée de l'animation (configurable via props)
              - repeatCount="indefinite": boucle infinie
            */}
            <animate 
              attributeName="startOffset" 
              from="0%" 
              to="37.58%" 
              begin="0s" 
              dur={`${animationDuration}s`} 
              repeatCount="indefinite"
            />
            
            {/* 
              Logique conditionnelle pour la mise en surbrillance du texte
              Si highlightText est fourni, on traite chaque mot individuellement
              Sinon, on affiche le texte répété tel quel
            */}
            {highlightText ? (
              // Divise le texte répété en mots et traite chaque mot
              repeatedText.split(' ').map((word, index) => {
                // Vérifie si le mot actuel doit être mis en surbrillance
                // Comparaison insensible à la casse
                const isHighlighted = highlightText.toLowerCase().includes(word.toLowerCase());
                
                return (
                  // 
                  // Élément tspan pour chaque mot avec style conditionnel
                  // - key: identifiant unique pour React
                  // - className: applique soit la couleur de surbrillance soit la couleur normale
                  <tspan 
                    key={index}
                    className={isHighlighted ? "fill-[#DED279]" : "text-current"}
                  >
                    {/* 
                      Affiche le mot avec un espace après (sauf pour le dernier mot)
                      Évite d'avoir un espace en trop à la fin
                    */}
                    {word}{index < repeatedText.split(' ').length - 1 ? ' ' : ''}
                  </tspan>
                );
              })
            ) : (
              // Si pas de texte à surbriller, affiche le texte répété tel quel
              repeatedText
            )}
          </textPath>
        </text>
      </svg>
    </div>
  );
};

/**
 * Composant d'exemple/démo montrant comment utiliser AnimatedTextSVG
 * 
 * Ce composant n'est pas exporté et sert uniquement à démontrer
 * les différentes façons d'utiliser le composant principal
 */
const App = () => {
  return (
    <div>
      {/* Exemple basique avec valeurs par défaut */}
      <h1>Mon titre</h1>
      <p>Du contenu avant le composant</p>
      
      {/* Le composant compact avec paramètres par défaut */}
      <AnimatedTextSVG />
      
      <p>Du contenu après le composant</p>
      
      {/* Exemple avec paramètres personnalisés */}
      <AnimatedTextSVG 
        text="RESTAURANT DELICIEUX"
        highlightText="DELICIEUX"
        animationDuration={10}
        fontSize={18}
      />
    </div>
  );
};

export default App;
