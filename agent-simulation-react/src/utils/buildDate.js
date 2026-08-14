const buildDate = new Date(import.meta.env.VITE_BUILD_DATE);

export const updatedDate = Number.isNaN(buildDate.getTime())
  ? 'not long ago'
  : new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(buildDate);
