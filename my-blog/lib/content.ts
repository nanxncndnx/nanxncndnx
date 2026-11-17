import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export function getContent(contentType: 'posts' | 'books' | 'docs') {
  const contentDirectory = path.join(process.cwd(), contentType);
  
  if (!fs.existsSync(contentDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(contentDirectory);
  const markdown = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(contentDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title,
        date: data.date,
        excerpt: data.excerpt,
        content,
        type: contentType,
        pdf: undefined as string | undefined,
      };
    });

  // PDFs are shown as-is: title comes from the file name, no date or excerpt
  const pdfs = fileNames
    .filter(fileName => fileName.toLowerCase().endsWith('.pdf'))
    .map((fileName) => pdfEntry(contentType, fileName));

  // undated PDFs go first, then everything else newest first
  return [...pdfs, ...markdown.sort((a, b) => (a.date < b.date ? 1 : -1))];
}

function pdfEntry(contentType: 'posts' | 'books' | 'docs', fileName: string) {
  return {
    slug: fileName.replace(/\.pdf$/i, ''),
    title: fileName.replace(/\.pdf$/i, ''),
    date: undefined as string | undefined,
    excerpt: undefined as string | undefined,
    content: '',
    type: contentType,
    pdf: fileName as string | undefined,
  };
}

export function getContentBySlug(contentType: 'posts' | 'books' | 'docs', slug: string) {
  const pdfName = `${slug}.pdf`;
  if (fs.existsSync(path.join(process.cwd(), contentType, pdfName))) {
    return pdfEntry(contentType, pdfName);
  }

  const fullPath = path.join(process.cwd(), contentType, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    title: data.title,
    date: data.date,
    content,
    type: contentType,
    pdf: undefined as string | undefined,
  };
}
