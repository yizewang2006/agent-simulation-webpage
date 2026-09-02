import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkToc from 'remark-toc';
import rehypeSlug from 'rehype-slug';
import Header3rdGen from '../components/simulation-3rd-gen/Header3rdGen.jsx';
import Footer from '../components/shared/Footer.jsx';
import tutorialContent from '../content/tutorial.md?raw';
import styles from '../styles/3rd-gen/tutorial.module.css';

export default function Tutorial() {
  return (
    <div className={styles.tutorialPage}>
      <Header3rdGen title="Tutorial" subtitle={"3rd Generation"} />
      <main className={styles.tutorialMain}>
        <article className={styles.tutorialContent}>
          <Markdown
            remarkPlugins={[remarkGfm, remarkToc]}
            rehypePlugins={[rehypeSlug]}
          >
            {tutorialContent}
          </Markdown>
        </article>
      </main>
      <Footer />
    </div>
  );
}
