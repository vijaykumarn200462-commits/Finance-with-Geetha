/**
 * Centralized Navigation Configuration
 * 
 * Controls visibility of navigation items across desktop header and mobile menu drawers.
 * By default, secondary items (More dropdown, Community, Book, Store) are temporarily hidden,
 * while core accounting links (About, Services, Why Us, Contact) and contact actions remain visible.
 */

export interface NavigationConfig {
  showMore: boolean;
  showCommunity: boolean;
  showBook: boolean;
  showStore: boolean;
  showAbout: boolean;
  showServices: boolean;
  showWhyUs: boolean;
  showContact: boolean;
  phone: string;
  consultationButtonText: string;
}

export const DEFAULT_NAVIGATION_CONFIG: NavigationConfig = {
  showMore: false, // Temporarily hidden per user request
  showCommunity: false, // Temporarily hidden per user request
  showBook: false, // Temporarily hidden per user request
  showStore: false, // Temporarily hidden per user request
  showAbout: true,
  showServices: true,
  showWhyUs: true,
  showContact: true,
  phone: '9538913912',
  consultationButtonText: 'Book Consultation',
};
