import { getContentBySlug, getContent } from '@/lib/content';
import { remark } from 'remark';
import html from 'remark-html';
import Link from 'next/link';
import PdfPages from '@/app/components/PdfPages';

export async function generateStaticParams() {
  try {
    const docs = getContent('docs');
    const validDocs = docs.filter(doc => doc && doc.slug);
    return validDocs.map((doc) => ({
      slug: doc.slug,
    }));
  } catch (error) {
    console.error('Error generating static params for docs:', error);
    return [];
  }
}

export default async function Doc({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;  // <-- AWAIT params here!
  const doc = getContentBySlug('docs', slug);

  if (doc.pdf) {
    const pdfUrl = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/docs-pdf/${encodeURIComponent(doc.pdf)}`;
    return (
      <div className="max-w-5xl mx-auto px-8 py-12">
        <Link href="/docs" className="text-blue-600 hover:underline mb-8 inline-block">
          ← Back to Docs
        </Link>

        <article>
          <h1 className="text-4xl font-bold mb-2">{doc.title}</h1>
          <p className="text-gray-600 mb-8">
            <a href={pdfUrl} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
              Open PDF in a new tab
            </a>
          </p>
          <PdfPages url={pdfUrl} />
        </article>
      </div>
    );
  }

  const processedContent = await remark().use(html).process(doc.content);
  const contentHtml = processedContent.toString();

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <Link href="/docs" className="text-blue-600 hover:underline mb-8 inline-block">
        ← Back to Docs
      </Link>
      
      <article>
        <h1 className="text-4xl font-bold mb-2">{doc.title}</h1>
        <p className="text-gray-600 mb-8">{doc.date}</p>
        <div 
          className="prose lg:prose-xl max-w-none"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>
    </div>
  );
}
