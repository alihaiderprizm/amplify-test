# E-Commerce Platform

A fullstack e-commerce platform built with Next.js, AWS Cognito, and PostgreSQL.

## Features

- User authentication with AWS Cognito
- Product management (CRUD operations)
- Shopping cart functionality
- Order management
- Admin dashboard
- Responsive design

## Prerequisites

- Node.js 18.x or later
- PostgreSQL 14.x or later
- AWS Account with Cognito setup
- AWS CLI configured

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ecommerce-platform
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up PostgreSQL database:
   ```bash
   psql -U postgres -f src/db/schema.sql
   ```

4. Configure AWS Cognito:
   - Create a new User Pool in AWS Cognito
   - Create an App Client
   - Note down the User Pool ID and Client ID

5. Create a `.env.local` file in the root directory with the following variables:
   ```
   # AWS Cognito
   COGNITO_CLIENT_ID=your_cognito_client_id
   COGNITO_CLIENT_SECRET=your_cognito_client_secret
   COGNITO_ISSUER=https://cognito-idp.{region}.amazonaws.com/{user_pool_id}
   NEXT_PUBLIC_AWS_REGION=your_aws_region

   # PostgreSQL
   DATABASE_URL=postgresql://username:password@localhost:5432/ecommerce

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

6. Run the development server:
   ```bash
   yarn dev
   ```

## Deployment

1. Set up AWS Amplify:
   ```bash
   amplify init
   amplify add auth
   amplify push
   ```

2. Configure environment variables in AWS Amplify console:
   - Add all variables from `.env.local`
   - Set `NEXTAUTH_URL` to your production URL

3. Connect your repository to AWS Amplify and deploy:
   - Follow the AWS Amplify console instructions
   - Enable automatic deployments

## Project Structure

```
src/
├── app/
│   ├── admin/           # Admin dashboard
│   ├── api/             # API routes
│   ├── auth/            # Authentication pages
│   ├── cart/            # Shopping cart page
│   ├── orders/          # Orders page
│   └── page.tsx         # Home page
├── components/          # Reusable components
├── db/                  # Database utilities
└── middleware.ts        # Route protection
```

## API Routes

- `/api/products` - Product management
- `/api/cart` - Shopping cart operations
- `/api/orders` - Order management
- `/api/auth/[...nextauth]` - Authentication
- `/api/auth/register` - User registration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
