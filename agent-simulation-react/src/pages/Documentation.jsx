import Markdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import remarkToc from 'remark-toc';
import Header3rdGen from '../components/simulation-3rd-gen/Header3rdGen.jsx';
import Footer from '../components/shared/Footer.jsx';
import documentationContent from '../content/documentation.md?raw';
import styles from '../styles/3rd-gen/tutorial.module.css';

export default function Documentation() {
  return (
    <div className={styles.tutorialPage}>
      <Header3rdGen title="Documentation" subtitle="3rd Generation" />
      <main className={styles.tutorialMain}>
        <article className={styles.tutorialContent}>
          <Markdown
            remarkPlugins={[remarkGfm, remarkToc]}
            rehypePlugins={[rehypeSlug]}
          >
            {documentationContent}
          </Markdown>
        </article>
      </main>
      <Footer />
    </div>
  );
}
