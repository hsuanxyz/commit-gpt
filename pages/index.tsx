import Head from 'next/head';
import { Terminal } from '../components/Terminal';

function Home() {
  return (
    <>
      <Head>
        <title>A GPT-3 based Conventional Commits Generator</title>
        <meta name="description" content="A GPT-3-based tool that uses the input prompts to generate several commit messages that conform to the conventional commit specifications." />
        <meta property="og:title" content="A GPT-3 based Conventional Commits generator" />
        <meta property="og:description" content="A GPT-3-based tool that uses the input prompts to generate several commit messages that conform to the conventional commit specifications." />
        <meta property="og:url" content="https://commit.hsuan.xyz/" />
        <meta property="og:type" content="website" />
        <link rel="shortcut icon" href="favicon.ico" />
      </Head>
      <main className="w-full max-w-4xl min-h-screen mx-auto py-8 flex flex-col gap-12">
        <section className="flex flex-col flex-1 min-h-full">
          <Terminal />
        </section>
      </main>
    </>
  );
}

export default Home;
