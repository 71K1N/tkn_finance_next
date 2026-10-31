# Changelog

Todas as mudanças relevantes deste projeto. Gerado por `npm run release` — não edite as seções de versões já publicadas.

## [0.2.0](https://github.com/71K1N/tkn_finance_next/compare/v0.1.0...v0.2.0) (2026-10-31)


### Funcionalidades

* add MoneyInput component and formatCurrency utility; refactor forms to use MoneyInput for currency input ([472d5ce](https://github.com/71K1N/tkn_finance_next/commit/472d5cedc5551d1f2da0935bad77b3d61a4887ed))
* add new API endpoints and types for bank accounts, budgets, savings goals, shared expense groups, subcategories, transactions, and wish items ([29697bb](https://github.com/71K1N/tkn_finance_next/commit/29697bb88ef6bd9b78d3a5c805c0a91b3c1ee651))
* **categoria:** ajusta categoria ([68255b9](https://github.com/71K1N/tkn_finance_next/commit/68255b9800ad546f84a0397760dad34b3d5227ea))
* enhance date handling and error messaging across transaction components; add utility functions for local date formatting ([3eca3e0](https://github.com/71K1N/tkn_finance_next/commit/3eca3e0a04b420c377ff7cafac5184559a86021b))
* enhance wishlist page with status badges and layout adjustments ([1e37f2d](https://github.com/71K1N/tkn_finance_next/commit/1e37f2dddb4972472a3237ab60553c95fabd7969))
* implement statement import functionality ([e7cbedf](https://github.com/71K1N/tkn_finance_next/commit/e7cbedf58aa0d1d7f8a1a7ee0598a312048fd849))
* implement useFormatCurrency hook and integrate it across various components; add HideValuesContext for managing visibility of currency values ([3c04058](https://github.com/71K1N/tkn_finance_next/commit/3c04058cc0c6abd6592b72203d85834626df3d27))
* migrate from tikin-ds to tikin-uai; update imports and components across the application ([422f485](https://github.com/71K1N/tkn_finance_next/commit/422f4856ee88feee84d711f5c559e55919cfbc0d))
* refactor dashboard components and add sidebar navigation ([f5fcd20](https://github.com/71K1N/tkn_finance_next/commit/f5fcd200bb59f04f15db7957b84efb1711563366))
* **release:** add versioning and release flow ([c6d6ff8](https://github.com/71K1N/tkn_finance_next/commit/c6d6ff8b5fd03f60c0f24b5d61ce2a12f2455bc8))
* **transaction:** add frontend UI for transaction intent tracking ([cb01cbf](https://github.com/71K1N/tkn_finance_next/commit/cb01cbf41cc20ef675055ea35f29f9756ada513f))
* update tikin-ds dependency to version 0.0.4; enhance transaction filtering and add filter modal ([4f5ccd8](https://github.com/71K1N/tkn_finance_next/commit/4f5ccd8a3f630d1cf3e9e631ba72afc42ae6e900))


### Correções

* **api:** add authorization headers to fetch requests in account and transaction pages ([f95fc37](https://github.com/71K1N/tkn_finance_next/commit/f95fc37ab254875de3c402206ac93c77f7a8d981))
* **subcategory:** add authorization headers to API requests ([2a7473d](https://github.com/71K1N/tkn_finance_next/commit/2a7473d9d3b687625a4d0bd52ef141389b91ceab))
* **subcategory:** fix select category ([4b1cf38](https://github.com/71K1N/tkn_finance_next/commit/4b1cf3801110427d875b6354e3d3a8876bf05cbd))
* **transaction:** handle nullable RadioGroup value in filter modal ([2aeaf2e](https://github.com/71K1N/tkn_finance_next/commit/2aeaf2ee1472d0852227ca0393d070c0b6ee96db))
* **transaction:** update payment modal handling and API request method ([db3a4f4](https://github.com/71K1N/tkn_finance_next/commit/db3a4f4820255df3e776f5a576e525ada0dbc828))


### Refatorações

* migrar IDs de number para string (ObjectId) e extrair componentes do dashboard ([006926d](https://github.com/71K1N/tkn_finance_next/commit/006926d42e0f1db57c4f20d62256dc1170c1ace9))
