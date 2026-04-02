# Skills / Habilidades usadas ate agora

## Estrutura e organizacao
- Criacao de estrutura de pastas/arquivos do projeto (`backend/`, `netlify/functions/`, `public/`, `components/`, `assets/`).
- Padronizacao de caminhos e convencoes para front-end estatico + Netlify Functions.

## Front-end (HTML + Bootstrap)
- Home page `public/index.html` com Bootstrap 5 e Bootstrap Icons.
- Includes por `data-include` para layout:
  - `public/components/layout/header.html`
  - `public/components/layout/sidebar.html`
  - `public/components/layout/footer.html`
- Simplificacao de layout usando Flex utilities (`d-flex`) no lugar de grid (`col-*`, `row`).

## Component loader (includes)
- Loader via `fetch`: `public/assets/js/components/include.js`.
- Suporte a includes aninhados (recursao).
- Preenchimento automatico de ano no footer com `data-year`.

## Estilo e identidade visual (CSS)
- Design tokens com CSS variables: `public/assets/css/global.css`.
- Tipografia (Google Fonts Montserrat): `public/assets/css/typography.css`.
- Layout/component styles:
  - `public/assets/css/layout.css`
  - `public/assets/css/components.css`
  - `public/assets/css/pages/home.css`

## Components
- Hero slider (3 imagens + repeticao para loop):
  - `public/components/home/hero.html`
  - `public/assets/css/sections/hero.css`

## Assets
- Logo `.webp` no header/footer/sidebar e como favicon: `public/assets/images/logoCintas.webp`.

---

# System logic (MVP)

## System type
- Simple e-commerce/catalog MVP.

## Main business idea
- Catalog with cart and order request.
- V1 sends the final order to WhatsApp.
- No internal payment flow yet.
- No `sessions` table.
- No `seller_profiles` table (seller logic handled by `users.role`).

## Core entities
1. User
- Fields: `id`, `name`, `email`, `phone`, `password_hash`, `role (common|seller|admin)`, `is_active`, `created_at`, `updated_at`.
- Rules: sellers/admins are users by role.

2. Category
- Fields: `id`, `name`, `slug`, `description`, `is_active`, `sort_order`, `created_at`, `updated_at`.

3. Product
- Fields: `id`, `seller_id`, `category_id`, `name`, `slug`, `description`, `price_cents`, `currency`, `stock`, `is_active`, `created_at`, `updated_at`.
- Rules: `seller_id` references User and must be a user with role `seller`.

4. ProductImage
- Fields: `id`, `product_id`, `storage_path`, `alt_text`, `is_cover`, `sort_order`, `created_at`.
- Rules: one cover image per product.

5. Cart
- Fields: `id`, `user_id`, `status (open|ordered|abandoned)`, `created_at`, `updated_at`.
- Rules: only one open cart per user at a time.

6. CartItem
- Fields: `id`, `cart_id`, `product_id`, `quantity`, `created_at`, `updated_at`.
- Rules: no duplicated product inside the same cart.

7. Order
- Fields: `id`, `user_id`, `status (pending|sent_to_whatsapp|confirmed|canceled|completed)`, `subtotal_cents`, `shipping_cents`, `discount_cents`, `total_cents`, `currency`, `customer_name`, `customer_phone`, `delivery_address`, `note`, `whatsapp_sent_at`, `created_at`, `updated_at`.
- Rules: totals controlled by backend; stores request history.

8. OrderItem
- Fields: `id`, `order_id`, `product_id`, `product_name`, `unit_price_cents`, `quantity`, `line_total_cents`, `created_at`.
- Rules: snapshot at order creation time.

9. Favorite
- Fields: `id`, `user_id`, `product_id`, `created_at`.
- Rules: unique per (`user_id`, `product_id`).

10. ContactMessage
- Fields: `id`, `name`, `email`, `whatsapp`, `subject`, `message`, `status (new|read|resolved|spam)`, `created_at`.

## Relationships summary
- User 1:N Product (seller owns products)
- Category 1:N Product
- Product 1:N ProductImage
- User 1:N Cart
- Cart 1:N CartItem
- Product 1:N CartItem
- User 1:N Order
- Order 1:N OrderItem
- Product 1:N OrderItem
- User 1:N Favorite
- Product 1:N Favorite

## Behavior summary
- Browse categories/products -> add to cart -> convert cart into order request -> send to WhatsApp -> keep orders for history.
