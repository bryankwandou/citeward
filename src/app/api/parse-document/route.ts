import { NextRequest, NextResponse } from 'next/server';
import { createDocxBuffer, parseDocumentBuffer } from '@/lib/document-parser';
import { SAMPLE_MANUSCRIPTS } from '@/lib/corpus';
import { runManuscriptAudit } from '@/lib/similarity-engine';
import { inspectHomoglyphsAndAiTells } from '@/lib/forensics-and-ecosystem';

const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'docx',
  'odt',
  'rtf',
  'txt',
  'md',
  'tex',
  'csv',
  'json',
  'html',
  'htm',
]);

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB limit

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get('sample') || 'docx';
  const sampleId = req.nextUrl.searchParams.get('id') || SAMPLE_MANUSCRIPTS[0].id;
  const sample =
    SAMPLE_MANUSCRIPTS.find((s) => s.id === sampleId) || SAMPLE_MANUSCRIPTS[0];

  if (format === 'docx') {
    const docxBuf = createDocxBuffer(sample.title, sample.author, sample.text);
    return new NextResponse(new Uint8Array(docxBuf), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="citeward-${sample.id}.docx"`,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    supportedFormats: Array.from(ALLOWED_EXTENSIONS),
    maxUploadMegabytes: 15,
  });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { ok: false, error: 'No document file provided in form-data.' },
          { status: 400 }
        );
      }

      const fileName = file.name || 'manuscript.txt';
      const ext = fileName.split('.').pop()?.toLowerCase() || '';

      if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          {
            ok: false,
            error: `Unsupported file extension .${ext}. Supported formats: .pdf, .docx, .odt, .rtf, .tex, .md, .txt, .html`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Document exceeds the 15 MB upload limit.',
          },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parsed = parseDocumentBuffer(fileName, buffer);

      if (!parsed.text.trim()) {
        return NextResponse.json(
          {
            ok: false,
            error:
              parsed.warnings[0] ||
              'No extractable text found in document. Ensure the PDF contains a selectable text layer rather than scanned images.',
            parsed,
          },
          { status: 422 }
        );
      }

      const audit = runManuscriptAudit(parsed.text, {
        excludeQuotes: true,
        excludeBibliography: true,
        minWordMatch: 8,
      });
      const forensics = inspectHomoglyphsAndAiTells(parsed.text);

      return NextResponse.json({
        ok: true,
        parsed,
        audit,
        forensics,
      });
    }

    // JSON body handling: either { action: 'export-docx', title, author, text } or { fileName, base64 }
    const body = await req.json();

    if (body?.action === 'export-docx') {
      const title =
        typeof body.title === 'string' && body.title.trim()
          ? body.title.trim().slice(0, 200)
          : 'Citeward Audited Manuscript';
      const author =
        typeof body.author === 'string' && body.author.trim()
          ? body.author.trim().slice(0, 140)
          : 'Citeward Author';
      const text =
        typeof body.text === 'string' ? body.text.slice(0, 180000) : '';

      if (!text.trim()) {
        return NextResponse.json(
          { ok: false, error: 'Manuscript text is required for DOCX export.' },
          { status: 400 }
        );
      }

      const docxBuf = createDocxBuffer(title, author, text);
      return new NextResponse(new Uint8Array(docxBuf), {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="citeward-manuscript.docx"',
        },
      });
    }

    const fileName =
      typeof body?.fileName === 'string' ? body.fileName : 'manuscript.txt';
    const base64 = typeof body?.base64 === 'string' ? body.base64 : '';

    if (!base64) {
      return NextResponse.json(
        { ok: false, error: 'Missing file payload.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { ok: false, error: 'Document exceeds the 15 MB upload limit.' },
        { status: 400 }
      );
    }

    const parsed = parseDocumentBuffer(fileName, buffer);
    if (!parsed.text.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            parsed.warnings[0] ||
            'No extractable text found in document.',
          parsed,
        },
        { status: 422 }
      );
    }

    const audit = runManuscriptAudit(parsed.text, {
      excludeQuotes: true,
      excludeBibliography: true,
      minWordMatch: 8,
    });
    const forensics = inspectHomoglyphsAndAiTells(parsed.text);

    return NextResponse.json({
      ok: true,
      parsed,
      audit,
      forensics,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Failed to parse uploaded document.',
      },
      { status: 500 }
    );
  }
}
