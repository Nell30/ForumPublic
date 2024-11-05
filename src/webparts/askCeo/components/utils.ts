import { ISPList } from "./interfaces";

export function sortItems(items: ISPList[], sortOrder: string): ISPList[] {
  return items.sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.Answers.toLowerCase().localeCompare(b.Answers.toLowerCase());
    } else if (sortOrder === 'desc') {
      return b.Answers.toLowerCase().localeCompare(a.Answers.toLowerCase());
    } else if (sortOrder === 'oldest') {
      return new Date(a.Created).getTime() - new Date(b.Created).getTime();
    } else if (sortOrder === 'newest') {
      return new Date(b.Created).getTime() - new Date(a.Created).getTime();
    } else if (sortOrder === 'pending') {
      return a.Status === 'Under Review' ? -1 : 1;
    } else if (sortOrder === 'approved') {
      return a.Status === 'Approved' ? -1 : 1;
    } else {
      return 0;
    }
  });
}


// export function renderPageNumbers(totalPages: number, currentPage: number): string {
//   let pageNumbers = '';

//   for (let i = 1; i <= totalPages; i++) {
//     pageNumbers += `<button class="page-number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
//   }

//   return pageNumbers;
// }

export function renderPageNumbers(totalPages: number, currentPage: number, maxVisiblePages: number = 5): string {
  console.log(`Rendering Page Numbers - Current Page: ${currentPage}, Total Pages: ${totalPages}`);
  let pageNumbers = '';
  const halfVisible = Math.floor(maxVisiblePages / 2);

  let startPage = Math.max(currentPage - halfVisible, 1);
  let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

  if (totalPages <= 1) {
    return ''; // Don't render pagination if there's only one page or no pages
  }

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(endPage - maxVisiblePages + 1, 1);
  }

  if (startPage > 1) {
    pageNumbers += `<button class="page-number" data-page="1">1</button>`;
    if (startPage > 2) {
      pageNumbers += `<span class="ellipsis">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers += `<button class="page-number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pageNumbers += `<span class="ellipsis">...</span>`;
    }
    pageNumbers += `<button class="page-number" data-page="${totalPages}">${totalPages}</button>`;
  }

  return pageNumbers;
}
