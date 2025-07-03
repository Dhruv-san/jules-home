import { NhostClient } from '@nhost/nhost-js'

// Ensure you have a .env file at the root of your 'cofounder-app' project (and add it to .gitignore)
// For local development, it would contain:
// REACT_APP_NHOST_SUBDOMAIN=jcsbkxlsyqxqnpvffgvk
// REACT_APP_NHOST_REGION=ap-south-1

const subdomain = process.env.REACT_APP_NHOST_SUBDOMAIN || 'jcsbkxlsyqxqnpvffgvk';
const region = process.env.REACT_APP_NHOST_REGION || 'ap-south-1';

if (!subdomain || !region) {
  if (process.env.NODE_ENV !== 'production') { // Only log detailed error in dev
    console.error("Nhost subdomain or region is not defined. Please check your .env file or environment variables.");
    alert("Nhost configuration is missing. App may not work correctly. See console for details.");
  } else {
    // In production, you might want a more generic error or silent failure if these are critical
    // For now, this setup assumes they will be provided in Netlify's build environment.
  }
}


const nhost = new NhostClient({
  subdomain: subdomain,
  region: region
});

export { nhost }
