# 🎫 leepoo - NFT Powered Event Ticketing Platform

An on-chain event ticketing platform that issues tickets as NFTs. This allows for secure, transparent, and easily transferable ticket ownership, eliminating fraud and scalping. It can be used for concerts, sports events, and conferences.

# Contract Address
0x094d3736C8dfe4cAba0b63CC0B7eD9e189642550

## 🌟 Overview

leepoo transforms the traditional event ticketing industry by utilizing blockchain technology to create tamper-proof, verifiable tickets as NFTs. This eliminates fraud, enables secure transfers, and provides event organizers with powerful tools to manage their events.

## ✨ Key Features

### 🎟️ NFT-Based Tickets
- **Secure & Verifiable**: Each ticket is minted as a unique NFT on the blockchain
- **Fraud Prevention**: Immutable blockchain records eliminate counterfeit tickets
- **Instant Transfers**: Transfer tickets securely between users in real-time
- **Proof of Ownership**: Cryptographic proof of ticket ownership

### 🎪 Event Management
- **Create Events**: Organizers can easily create and configure events
- **Ticket Parameters**: Set pricing, quantities, and access levels
- **Real-time Analytics**: Track sales and attendance metrics
- **Automated Distribution**: Smart contract-based ticket distribution

### 💼 User Experience
- **Wallet Integration**: Connect with popular Web3 wallets
- **Dashboard**: Comprehensive user dashboard for managing tickets and events
- **Mobile Responsive**: Optimized for all devices
- **Intuitive Interface**: Clean, modern UI built with shadcn/ui components

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Fonts**: Geist Sans & Geist Mono
- **Analytics**: Vercel Analytics

### Design System
- **Color Scheme**: Navy blue primary theme with neutral accents
- **Components**: Modular, reusable UI components
- **Responsive**: Mobile-first design approach
- **Accessibility**: WCAG compliant components

### Development Tools
- **Package Manager**: npm/yarn
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Build Tool**: Next.js built-in bundler

## 📁 Project Structure

\`\`\`
leepoo-ticketing/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles and Tailwind configuration
│   ├── layout.tsx               # Root layout component
│   └── page.tsx                 # Landing page
├── components/                   # Reusable components
│   ├── ui/                      # Base UI components (shadcn/ui)
│   │   ├── button.tsx           # Button component with variants
│   │   ├── card.tsx             # Card component with sections
│   │   ├── input.tsx            # Form input component
│   │   ├── textarea.tsx         # Textarea component
│   │   ├── label.tsx            # Form label component
│   │   ├── badge.tsx            # Status badge component
│   │   ├── radio-group.tsx      # Radio button group
│   │   └── select.tsx           # Dropdown select component
│   └── dashboard/               # Dashboard-specific components
│       ├── sidebar.tsx          # Navigation sidebar
│       └── wallet-card.tsx      # Wallet status display
├── lib/                         # Utility functions
│   └── utils.ts                 # Class name utilities (cn function)
├── hooks/                       # Custom React hooks
│   ├── use-mobile.tsx           # Mobile detection hook
│   └── use-toast.ts             # Toast notification hook
├── next.config.mjs              # Next.js configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
└── README.md                    # Project documentation
\`\`\`

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/Samuel1505/EventTicketing.git
   cd EventTicketing
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

### Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## 🎨 Design System

### Color Palette
- **Primary**: Navy blue (`oklch(0.205 0 0)`)
- **Background**: White/Dark (`oklch(1 0 0)` / `oklch(0.145 0 0)`)
- **Muted**: Light gray (`oklch(0.97 0 0)`)
- **Accent**: Matching navy variations

### Typography
- **Headings**: Geist Sans (various weights)
- **Body**: Geist Sans (regular)
- **Code**: Geist Mono

### Components
All components follow the shadcn/ui design system with custom navy blue theming:
- Consistent spacing using Tailwind's scale
- Accessible color contrasts
- Responsive design patterns
- Focus states and keyboard navigation

## 📱 Features Breakdown

### Landing Page
- Hero section with clear value proposition
- Feature highlights with icons and descriptions
- How-it-works process explanation
- Comprehensive footer with navigation links

### Navigation
- Clean header with brand identity
- Quick access to key features:
  - Explore Events
  - Create Event
  - My Tickets
  - Dashboard

### User Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Support**: Built-in dark/light theme switching
- **Loading States**: Smooth transitions and loading indicators
- **Error Handling**: User-friendly error messages and fallbacks

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Consistent component patterns
- Modular architecture

### Component Guidelines
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Follow accessibility best practices
- Use semantic HTML elements

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables (if any)
3. Deploy automatically on push to main branch



## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add TypeScript types for new components
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Vercel](https://vercel.com/) - Deployment platform
- [Geist Font](https://vercel.com/font) - Typography

## 📞 Support

For support, email support@leepoo.com or join our community Discord.

## 🗺️ Roadmap

- [ ] Wallet integration (MetaMask, WalletConnect)
- [ ] Smart contract deployment
- [ ] Event creation interface
- [ ] Ticket purchasing flow
- [ ] NFT minting functionality
- [ ] Secondary marketplace
- [ ] Mobile app development
- [ ] Multi-chain support

---



