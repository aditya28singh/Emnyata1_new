// pages/_app.js
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Add any paths here that should NOT use the Layout
  const noLayoutNeeded = ['/', '/auth', '/404', '/_error'];

  // If we're on one of these pages, skip the Layout
  if (noLayoutNeeded.includes(router.pathname)) {
    return <Component {...pageProps} />;
  }

  // Otherwise, wrap page in your Layout (with Header + Sidebar)
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

// Add error handling
MyApp.getInitialProps = async ({ Component, ctx }) => {
  let pageProps = {};

  if (Component.getInitialProps) {
    try {
      pageProps = await Component.getInitialProps(ctx);
    } catch (error) {
      console.error('Error in getInitialProps:', error);
      // Handle the error appropriately
    }
  }

  return { pageProps };
};

export default MyApp;