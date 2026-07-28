//@/utils.ts
/**
 * Calculs de pagination externalisés - seulement appelés si besoin dans les composants UI
 */

export const getPaginationInfo = (totalItems: number, currentPage: number, itemsPerPage: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;
    
    return {
      currentPage,
      totalPages,
      totalItems,
      hasNextPage,
      hasPrevPage,
      itemsInPage: Math.min(itemsPerPage, totalItems - (currentPage - 1) * itemsPerPage)
    };
  };
  
  export const getVisiblePages = (currentPage: number, totalPages: number, maxVisible: number = 5) => {
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    // Ajuster si on est près de la fin
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };


  