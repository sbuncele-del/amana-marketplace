import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {getCatalogueProduct} from '@/lib/catalogue';
import {ExperienceError, operator} from '@/lib/experience/access';
import {experiencePool} from '@/lib/experience/store';
import {catalogueOrderPhoto, savedOrderPhoto} from '@/lib/order-item-image';

const headers = {'Cache-Control': 'private, no-store'};
const cartLine = /^([a-z0-9][a-z0-9_-]{0,199}):([^:]{1,100})$/i;

export async function GET(request: NextRequest) {
  try {
    const op = await operator();
    const id = z.string().uuid().safeParse(request.nextUrl.searchParams.get('order'));
    if (!id.success) throw new ExperienceError(400, 'Choose an order.');
    const {rows: [order]} = await experiencePool().query(
      `SELECT data->'items' AS items FROM experience_records
       WHERE id=$1 AND kind='ORDER' AND coalesce(data->>'country','ZA')='ZA'
         AND ($2::boolean OR team_id=ANY($3::text[]))`,
      [id.data, op.admin, op.teamIds],
    );
    if (!order) throw new ExperienceError(404, 'Order not found.');
    const items: unknown[] = Array.isArray(order.items) ? order.items : [];
    const products = new Map<string, ReturnType<typeof getCatalogueProduct>>();
    const photos = await Promise.all(items.map(async value => {
      if (!value || typeof value !== 'object') return null;
      const item = value as {id?: unknown; image?: unknown; variantImage?: unknown};
      const saved = savedOrderPhoto(item);
      if (saved) return saved;
      const match = typeof item.id === 'string' ? cartLine.exec(item.id) : null;
      if (!match) return null;
      const [, slug, variantId] = match;
      if (!products.has(slug)) products.set(slug, getCatalogueProduct(slug, false, false, 'ZA', 2500).catch(() => null));
      const product = await products.get(slug);
      return product ? catalogueOrderPhoto(product, variantId) ?? null : null;
    }));
    return NextResponse.json({photos}, {headers});
  } catch (error) {
    const status = error instanceof ExperienceError ? error.status : 503;
    return NextResponse.json({error: error instanceof ExperienceError ? error.message : 'Order photos are temporarily unavailable.'}, {status, headers});
  }
}
