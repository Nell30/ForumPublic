import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { faCommentAlt } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import { ISPList, SortOrder } from './components/interfaces';
import { sortItems, renderPageNumbers } from './components/utils';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';

import styles from './AskCeoWebPart.module.scss';

//const logoImage: any = require('./assets/companyLogo.jpg');
const jakeImage: any = require('./assets/JakePic.png');


library.add(faCommentAlt);

export interface IAskCeoWebPartProps {
  description: string;
}

export default class AskCeoWebPart extends BaseClientSideWebPart<{}> {
  private sortOrder: SortOrder = SortOrder.Newest;
  private currentPage = 1;
  private readonly itemsPerPage = 10;
  private totalPages: number = 1;

  private async getListData(): Promise<ISPList[]> {
    const response = await this.context.spHttpClient.get(
      `${this.context.pageContext.web.absoluteUrl}/_api/web/lists/GetByTitle('Reflection')/items?$top=5000`,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      throw new Error(`Error fetching list data: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value;
  }

  private renderList(items: ISPList[]): void {

    // Filter approved items first
    const approvedItems = items.filter(item => item.Status === "Approved");

    // Sort the approved items
    const sortedItems = sortItems(approvedItems, this.sortOrder);

    // Calculate total pages based on approved items
    this.totalPages = Math.ceil(sortedItems.length / this.itemsPerPage);
    

    // Ensure current page is within bounds
    this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    // Paginate the sorted and approved items
    const paginatedItems = sortedItems.slice(startIndex, endIndex);

    let html = '';
    
    if (paginatedItems.length === 0) {
      html = '<p>No results found.</p>';
    } else {       
    paginatedItems.forEach((item: ISPList) => {
      const createdDate = new Date(item.Created);
      const formattedDate = createdDate.toLocaleDateString();
      const formattedTime = createdDate.toLocaleTimeString();

      // Check if 'item.Replies' has a value and is not null, undefined, or an empty string.
      // If it does, split the string into an array where each element is separated by a newline.
      // If 'item.Replies' does not have a value, set 'replies' to an empty array.
      //const replies = item.Replies ? item.Replies.split('\n') : [];
      const replies = item.Replies ? [item.Replies] : [];


     if(item.Status === "Approved"){  
      html += `
        
        <div class="${styles.listItem}">
          <div class="${styles.listpadding}">
            <div class="${styles.itemHeader}">              
              <h3 class="${styles.itemTitle}">Q: <b class="${styles.itemTitle}">${item.Answers}</b></h3>           
              <div class="${styles.itemDate}">
                <span>${formattedDate}</span>
                <svg class=${styles.calendarIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M152 24c0-13.3-10.7-24-24-24s-24 10.7-24 24V64H64C28.7 64 0 92.7 0 128v16 48V448c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V192 144 128c0-35.3-28.7-64-64-64H344V24c0-13.3-10.7-24-24-24s-24 10.7-24 24V64H152V24zM48 192H400V448c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192z"/></svg>
                <span>${formattedTime}</span>
                <svg class="${styles.calendarIcon}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/></svg>
              </div>
            </div>
            
            <div class="${styles.itemReplies}">                   

            <div class="${styles.toggleContainer}">
            
              <b class="${styles.repliesText}">Replies:</b>
            </div>

          
            
              <div class="${styles.commentSection}">
                <i class="fa-solid fa-comment ${styles.commentIcon}"></i>
                <span class="${styles.replyCount}">${replies.length}</span>
                <span class="${styles.commentTooltip}">Click to collapse</span>
              </div>
            </div>
            <div class="${styles.repliesContainer}">

              <hr>

            <ul class="${styles.replyList}">
            ${replies.map(reply => `
              <li style="margin-top:5px">
                <pre>${reply}</pre>
              </li>
              </li>
            `).join('')}
          </ul>
              
                   
            </div>
          </div>
        </div>
      `;
     }
    });
  }
    const spListContainer = this.domElement.querySelector('#spListContainer');
    if (spListContainer) {
      spListContainer.innerHTML = html;

      const commentIcons = spListContainer.querySelectorAll(`.${styles.itemReplies}`);
      commentIcons.forEach((icon) => {
        icon.addEventListener('click', (event) => {
          event.preventDefault(); // Prevent any default action
          event.stopPropagation(); // Stop the event from bubbling up

          if (icon instanceof HTMLElement) {
            const listItem = icon.closest(`.${styles.listItem}`);
            if (listItem instanceof HTMLElement) {
              const repliesContainer = listItem.querySelector(`.${styles.repliesContainer}`);
              if (repliesContainer instanceof HTMLElement) {
                const isHidden = repliesContainer.classList.toggle('hidden');
                console.log('Toggled hidden class:', isHidden);
                icon.classList.toggle(`${styles.active}`);

                // Force a reflow to ensure the transition takes effect
                void repliesContainer.offsetWidth;

                if (isHidden) {
                  repliesContainer.style.maxHeight = '0px';
                } else {
                  repliesContainer.style.maxHeight = `${repliesContainer.scrollHeight}px`;
                }
              }
            }
          }
        });
      });

      const changeStatusButtons = spListContainer.querySelectorAll(`.${styles.changeStatusButton}`);
      changeStatusButtons.forEach((button) => {
        button.addEventListener('click', this.handleChangeStatus.bind(this));
      });

      const toggleSwitches = spListContainer.querySelectorAll('input[type="checkbox"]');
      toggleSwitches.forEach((toggleSwitch) => {
        toggleSwitch.addEventListener('change', this.handleToggleChange.bind(this));
      });
    }
    const paginationContainer = this.domElement.querySelector('.page-numbers');
    if (paginationContainer) {
      paginationContainer.innerHTML = renderPageNumbers(this.totalPages, this.currentPage, 5);
      this.addPaginationEventListeners(paginationContainer);
    }
    
  }


  private async handleToggleChange(event: Event): Promise<void> {
    const toggleSwitch = event.target as HTMLInputElement;
    const itemId = parseInt(toggleSwitch.getAttribute('data-item-id')!, 10);
    const newStatus = toggleSwitch.checked ? 'Approved' : 'Under Review';
  
    await this.updateItemStatus(itemId, newStatus);
    const items = await this.getListData();
    this.renderList(items);
  }
  
  private handleSearch(): void {
    const searchInput = this.domElement.querySelector('#searchInput') as HTMLInputElement;
    const searchTerm = searchInput.value.toLowerCase();
  
    this.getListData()
      .then((items) => {
        const filteredItems = items.filter((item) =>
          item.Answers.toLowerCase().includes(searchTerm)
        );
        this.renderList(filteredItems);
      })
      .catch((error) => {
        console.error('Error retrieving list data:', error);
      });
  }
  
  private async handleChangeStatus(event: Event): Promise<void> {
    const button = event.target as HTMLButtonElement;
    const itemId = parseInt(button.getAttribute('data-item-id')!, 10);

    // Find the specific item using the itemId
    const item = await this.getListItem(itemId);
    const newStatus = item.Status === 'Approved' ? 'Under Review' : 'Approved';


  
    await this.updateItemStatus(itemId, newStatus);
    const items = await this.getListData();
    this.renderList(items);
  }

  private async updateItemStatus(itemId: number, newStatus: string): Promise<void> {
    // Make an API call to update the item status in SharePoint
    // You can use the SPHttpClient to make the API request
    // Example:
    await this.context.spHttpClient.post(`${this.context.pageContext.web.absoluteUrl}/_api/web/lists/GetByTitle('Reflection')/items(${itemId})`, 
      SPHttpClient.configurations.v1,
      {
        headers: {
          'Accept': 'application/json;odata=nometadata',
          'Content-type': 'application/json;odata=nometadata',
          'odata-version': '',
          'IF-MATCH': '*',
          'X-HTTP-Method': 'MERGE',
        },
        body: JSON.stringify({
          Status: newStatus,
        }),
      }
    );
  }
  
  private async getListItem(itemId: number): Promise<ISPList> {
    const response: SPHttpClientResponse = await this.context.spHttpClient.get(
        `${this.context.pageContext.web.absoluteUrl}/_api/web/lists/GetByTitle('Reflection')/items(${itemId})`,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      throw new Error(`Error retrieving list item: ${response.statusText}`);
    }

    const data: ISPList = await response.json();
    return data;
  }

  private async getTopFavorites(): Promise<ISPList[]> {
    try {
      console.log('Fetching top favorites...');
      
      // Check for IsFavorite Yes (1)
      let url = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists/GetByTitle('Reflection')/items?$filter=IsFavorite eq 1&$top=10`;
      console.log('IsFavorite Yes URL:', url);
      let response = await this.context.spHttpClient.get(url, SPHttpClient.configurations.v1);
      let data = await response.json();
      console.log('IsFavorite Yes results:', data.value);
  
      // Check for IsFavorite No (0)
      url = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists/GetByTitle('Reflection')/items?$filter=IsFavorite eq 0&$top=10`;
      console.log('IsFavorite No URL:', url);
      response = await this.context.spHttpClient.get(url, SPHttpClient.configurations.v1);
      data = await response.json();
      console.log('IsFavorite No results:', data.value);
  
      // Check for all items and their IsFavorite values
      url = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists/GetByTitle('Reflection')/items?$select=Id,Title,IsFavorite,Status&$top=10`;
      console.log('All items URL:', url);
      response = await this.context.spHttpClient.get(url, SPHttpClient.configurations.v1);
      data = await response.json();
      console.log('All items results:', data.value);
  
      // Updated original query
      url = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists/GetByTitle('Reflection')/items?$filter=Status eq 'Approved' and IsFavorite eq 1&$orderby=Created desc&$top=10`;
      console.log('Updated original query URL:', url);
      response = await this.context.spHttpClient.get(url, SPHttpClient.configurations.v1);
      data = await response.json();
      console.log('Updated original query results:', data.value);
  
      return data.value;
    } catch (error) {
      console.error('Error fetching top favorites:', error);
      return [];
    }
  }

  private renderSlideshow(favorites: ISPList[]): string {
    let slideshowHtml = `
      <div class="${styles.slideshow}">
        <div class="${styles.slideshowTitle}" id="slideshowTitle">
          Top Favorite Questions From The CEO
          <span class="${styles.toggleIcon}">▼</span>
        </div>
        <div class="${styles.slideshowWrapper}" id="slideshowWrapper">
          <div class="${styles.slideshowContainer}" id="slideshowContainer">
    `;

    favorites.forEach((item, index) => {
      slideshowHtml += `
        <div class="${styles.slide} ${index === 0 ? styles.active : ''}" style="height: auto; overflow: auto;">
          <div class="${styles.slideContent}">
            <h3 style="color:#005596;">Q:${item.Answers}</h3>
            <hr width="100%">
            <p class="${styles.favoriteReplies}"><p ${styles.boldJake}>Answer: </p>${item.Replies}</p>
            <p>Submitted: ${new Date(item.Created).toLocaleDateString()}</p>
          </div>
        </div>
      `;
    });

    slideshowHtml += `
          </div>
          <button class="${styles.slidePrev}">❮</button>
          <button class="${styles.slideNext}">❯</button>
        </div>
      </div>
    `;

    return slideshowHtml;
  }
  
  private setupSlideshow(): void {
    const slides = this.domElement.querySelectorAll(`.${styles.slide}`) as NodeListOf<HTMLElement>;
    const prevButton = this.domElement.querySelector(`.${styles.slidePrev}`) as HTMLElement;
    const nextButton = this.domElement.querySelector(`.${styles.slideNext}`) as HTMLElement;
    const slideshowWrapper = this.domElement.querySelector(`#slideshowWrapper`) as HTMLElement;
    const slideshowContainer = this.domElement.querySelector(`#slideshowContainer`) as HTMLElement;
    const slideshowTitle = this.domElement.querySelector(`#slideshowTitle`) as HTMLElement;
    const toggleIcon = slideshowTitle.querySelector(`.${styles.toggleIcon}`) as HTMLElement;

    if (slides.length === 0) {
      if (slideshowContainer) {
        slideshowContainer.innerHTML = '<p>No favorite questions found.</p>';
      }
      if (prevButton) prevButton.style.display = 'none';
      if (nextButton) nextButton.style.display = 'none';
      return;
    }

    let currentSlide = 0;

    const adjustContainerHeight = (slideIndex: number) => {
      const slideHeight = slides[slideIndex].scrollHeight;
      slideshowContainer.style.height = `${slideHeight}px`;
    };

    const showSlide = (n: number) => {
      slides[currentSlide].classList.remove(styles.active);
      currentSlide = (n + slides.length) % slides.length;
      slides[currentSlide].classList.add(styles.active);
      adjustContainerHeight(currentSlide);
    };

    prevButton?.addEventListener('click', () => showSlide(currentSlide - 1));
    nextButton?.addEventListener('click', () => showSlide(currentSlide + 1));

    // Toggle slideshow visibility with animation
    slideshowTitle.addEventListener('click', () => {
      const isHidden = slideshowWrapper.classList.contains(styles.hidden);
      if (isHidden) {
        slideshowWrapper.classList.remove(styles.hidden);
        slideshowWrapper.style.maxHeight = `${slideshowWrapper.scrollHeight}px`;
        toggleIcon.textContent = '▲';
        setTimeout(() => {
          slideshowWrapper.style.maxHeight = 'none';
          adjustContainerHeight(currentSlide);
        }, 300); // Adjust this value to match the transition duration in CSS
      } else {
        slideshowWrapper.style.maxHeight = `${slideshowWrapper.scrollHeight}px`;
        setTimeout(() => {
          slideshowWrapper.style.maxHeight = '0';
          slideshowWrapper.classList.add(styles.hidden);
          toggleIcon.textContent = '▼';
        }, 10);
      }
    });

    // Auto-advance slides every 10 seconds (only when visible)
    // setInterval(() => {
    //   if (!slideshowWrapper.classList.contains(styles.hidden)) {
    //     showSlide(currentSlide + 1);
    //   }
    // }, 10000);

    // Adjust height on window resize (only when visible)
    window.addEventListener('resize', () => {
      if (!slideshowWrapper.classList.contains(styles.hidden)) {
        adjustContainerHeight(currentSlide);
      }
    });
  }

  public async render(): Promise<void> {
    try {
      const items = await this.getListData();
      const favorites = await this.getTopFavorites();
  
      // Calculate total pages based on the number of approved items
      const approvedItems = items.filter(item => item.Status === "Approved");
      this.totalPages = Math.ceil(approvedItems.length / this.itemsPerPage);
  
      // Ensure this.domElement is defined here
      if (!this.domElement) {
        console.error('this.domElement is undefined.');
        return;
      }
  
      this.domElement.innerHTML = `
        <head>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        </head>
        
         <header class="${styles.enhancedHeader}">
            <div class="${styles['header-content']}">          
            <div class="${styles.logoContainer}">
              <img src="${jakeImage}" alt="Company Logo" class="${styles.logo}">
            </div>
          
            <h1 class="${styles['header-tagline']}">Ask the CEO</h1>

        <p class="${styles['header-taglines']}">
            The TGHC is committed to ensuring that we operate in a transparent environment and everyone has the ability to ask questions, provide comments anonymously and access the President & CEO about things that matter to our staff and the patients and families we serve. This tool is designed to increase transparency, staff engagement, and communication and help ensure we are living our organization's values.
        </p>
        <p class="${styles['header-taglines']}">
            Feel free to ask any questions related to the topics below:
        </p>
          <ul class="${styles['topic-list']}">
              <li class="${styles['topic-item']}">Strategic Planning and Strategic Direction</li>
              <li class="${styles['topic-item']}">Research and Development</li>
              <li class="${styles['topic-item']}">Professional Practice and Education</li>
              <li class="${styles['topic-item']}">Quality</li>
              <li class="${styles['topic-item']}">Organizational Changes</li>
              <li class="${styles['topic-item']}">Funding</li>
              <li class="${styles['topic-item']}">Policies and Procedures</li>
              <li class="${styles['topic-item']}">And many more</li>
              <li class="${styles['topic-item-a']} ${styles['form-link']}">
                <a href="https://forms.office.com/Pages/ResponsePage.aspx?id=cbLpiEHK2ketF8-yscYkbi62T9hGe4hLni2UtMd87KhURTYxUU9NVFNOWExDS1pPN0pKUEVPVFM4Ty4u" target="_blank">Click here to ask a question</a>
              </li>
          </ul>
        </div>
        </header>
        
        ${favorites.length > 0 ? this.renderSlideshow(favorites) : '<p>No favorite questions found.</p>'}
  
        <div class="filterContainer">
          <div class="${styles.customSelect}">
            <select>
              <option value="${SortOrder.Newest}">Newest</option>              
              <option value="${SortOrder.Oldest}">Oldest</option>
              <option value="${SortOrder.Asc}">A-Z</option>
              <option value="${SortOrder.Desc}">Z-A</option>       
            </select>
          </div>
  
          <div class="${styles.searchBox}">
            <input type="text" placeholder="Search..." id="searchInput">
          </div>
        </div>
  
        <div id="spListContainer" class="${styles.spListContainer}"></div>
  
        <div class="${styles.pagination}">
          <ul class="${styles.paginationWrapper}">
            <a class="prev-button">&lt;</a>
            <span class="page-numbers"></span>
            <a class="next-button">&gt;</a>
          </ul>
        </div>
      `;
  
      this.renderList(items);
      if (favorites.length > 0) {
        this.setupSlideshow();
      }
  
      // Use arrow functions to maintain the context of 'this'
      const sortSelect = this.domElement.querySelector('select');
      sortSelect?.addEventListener('change', (event: Event) => {
        this.sortOrder = (event.target as HTMLSelectElement).value as SortOrder;
        this.currentPage = 1;
        this.renderList(items);
      });
    
      const searchInput = this.domElement.querySelector('#searchInput');
      if (searchInput) {
        searchInput.addEventListener('input', this.handleSearch.bind(this));
      }
  
      const prevButton = this.domElement.querySelector('.prev-button');
      const nextButton = this.domElement.querySelector('.next-button');
      const paginationNumbers = this.domElement.querySelector('.page-numbers');
  
      prevButton?.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderList(items);
        }
      });
  
      nextButton?.addEventListener('click', () => {
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
          this.renderList(items);
        }
      });
  
      if (paginationNumbers) {
        paginationNumbers.innerHTML = renderPageNumbers(this.totalPages, this.currentPage, 5);
        this.addPaginationEventListeners(paginationNumbers);
      }
  
      this.updateActiveButton();
    } catch (error) {
      console.error('Error rendering AskCeoWebPart:', error);
    }
  }
  
  private addPaginationEventListeners(paginationContainer: Element): void {
    const pageNumbers = paginationContainer.querySelectorAll('.page-number');
    pageNumbers.forEach((pageNumber) => {
      // Apply CSS styles to the page number element
      (pageNumber as HTMLElement).style.color = '#333';
      (pageNumber as HTMLElement).style.backgroundColor = '#fff';
      (pageNumber as HTMLElement).style.border = '1px solid #ddd';
      (pageNumber as HTMLElement).style.padding = '8px 16px';
      (pageNumber as HTMLElement).style.margin = '0 4px';
      (pageNumber as HTMLElement).style.borderRadius = '4px';
      (pageNumber as HTMLElement).style.cursor = 'pointer';
  
      // Add hover styles
      (pageNumber as HTMLElement).addEventListener('mouseover', () => {
        if (!(pageNumber as HTMLElement).classList.contains('active')) {
          (pageNumber as HTMLElement).style.backgroundColor = '#f5f5f5';
        }
      });
  
      // Remove hover styles
      (pageNumber as HTMLElement).addEventListener('mouseout', () => {
        if (!(pageNumber as HTMLElement).classList.contains('active')) {
          (pageNumber as HTMLElement).style.backgroundColor = '#fff';
        }
      });
  
      pageNumber.addEventListener('click', async (event: Event) => {
        const selectedPage = parseInt((event.target as HTMLButtonElement).getAttribute('data-page')!, 10);
        this.currentPage = selectedPage;
        this.renderList(await this.getListData());
        this.updateActiveButton();
      });
    });
  }
  
  private updateActiveButton(): void {
    const pageNumbers = this.domElement.querySelectorAll('.page-number');
    pageNumbers.forEach((pageNumber) => {
      if (parseInt((pageNumber as HTMLElement).getAttribute('data-page')!, 10) === this.currentPage) {
        (pageNumber as HTMLElement).classList.add('active');
        (pageNumber as HTMLElement).style.backgroundColor = '#005596';
        (pageNumber as HTMLElement).style.color = '#fff';
      } else {
        (pageNumber as HTMLElement).classList.remove('active');
        (pageNumber as HTMLElement).style.backgroundColor = '#fff';
        (pageNumber as HTMLElement).style.color = '#333';
      }
    });
  }


  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }
}
