import BookmarksTest from '@/app/ui/bookmarks-test';
import { montserrat } from '@/app/ui/fonts';

export const dynamic = 'force-dynamic';

export default function BookmarksTestPage() {
  return (
    <main>
      <h1 className={`${montserrat.className} mb-4 text-xl md:text-2xl`}>
        Bookmarks Test
      </h1>
      <BookmarksTest />
    </main>
  );
}

