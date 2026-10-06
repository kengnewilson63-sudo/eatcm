export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  // Cle Google Maps (Maps JavaScript API + Places API).
  // Visible cote client : ce n'est pas un secret, il FAUT la restreindre
  // dans Google Cloud Console (HTTP referrers + restrictions d'API),
  // sinon n'importe qui peut l'utiliser et consommer le quota.
  googleMapsApiKey: 'AIzaSyA2drvcr-VFOo6yU_wLGWQ8F2SQhiY8ILo',
};
