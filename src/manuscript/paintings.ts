export const paintings = [
  {
    id: 'nastagio', title: 'The Story of Nastagio degli Onesti, II', artist: 'Sandro Botticelli', year: '1483',
    source: 'https://commons.wikimedia.org/wiki/File:Nastagio_Degli_Onesti_II.jpg',
  },
  {
    id: 'palazzo-da-mula', title: 'Palazzo da Mula, Venice', artist: 'Claude Monet', year: '1908',
    source: 'https://www.nga.gov/artworks/46657-palazzo-da-mula-venice',
  },
  {
    id: 'green-wheat-fields', title: 'Green Wheat Fields, Auvers', artist: 'Vincent van Gogh', year: '1890',
    source: 'https://www.nga.gov/artworks/163323-green-wheat-fields-auvers',
  },
  {
    id: 'orrery', title: 'A Philosopher Lecturing on the Orrery', artist: 'Joseph Wright of Derby', year: '1766',
    source: 'https://derbymuseums.org/collection/joseph-wright-of-derby/',
  },
  {
    id: 'arcadia', title: 'The Course of Empire: The Arcadian or Pastoral State', artist: 'Thomas Cole', year: 'c. 1834',
    source: 'https://emuseum.nyhistory.org/objects/56323/the-course-of-empire-the-arcadian-or-pastoral-state',
  },
  {
    id: 'moonwatchers', title: 'Two Men Contemplating the Moon', artist: 'Caspar David Friedrich', year: 'c. 1825–30',
    source: 'https://www.metmuseum.org/art/collection/search/438417',
  },
] as const;

export const paintingImage = (id: string) => id === 'nastagio' ? '/manuscript/nastagio.webp' : `/paintings/${id}.webp`;
export const paintingThumbnail = (id: string) => `/paintings/${id}-thumb.webp`;
