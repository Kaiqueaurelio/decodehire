'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { createPortal } from 'react-dom';
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { LucideIcon } from 'lucide-react';
import {
	CodeIcon,
	GlobeIcon,
	LayersIcon,
	UserPlusIcon,
	Users,
	Star,
	FileText,
	Shield,
	RotateCcw,
	Handshake,
	Leaf,
	HelpCircle,
	BarChart,
	PlugIcon,
} from 'lucide-react';

type LinkItem = {
	title: string;
	href: string;
	icon: LucideIcon;
	description?: string;
};

export function Header() {
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(10);

	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	return (
		<header
			className={cn(
				'sticky top-0 z-50 w-full border-b transition-all duration-300',
				scrolled
					? 'bg-background/80 backdrop-blur-md shadow-sm'
					: 'bg-background',
			)}
		>
			<div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
				<div className="flex items-center gap-6">
					<a href="/" className="flex items-center gap-2">
						<WordmarkIcon className="h-6" />
					</a>
					<div className="hidden md:block">
						<NavigationMenu>
							<NavigationMenuList>
								<NavigationMenuItem>
									<NavigationMenuTrigger>Product</NavigationMenuTrigger>
									<NavigationMenuContent>
										<div className="grid w-[500px] gap-1 p-3 md:grid-cols-2">
											{productLinks.map((item, i) => (
												<ListItem key={i} {...item} />
											))}
										</div>
										<div className="border-t bg-muted/50 p-3">
											<p className="text-sm text-muted-foreground">
												Interested?{' '}
												<a
													href="#"
													className="font-medium text-primary underline underline-offset-4"
												>
													Schedule a demo
												</a>
											</p>
										</div>
									</NavigationMenuContent>
								</NavigationMenuItem>
								<NavigationMenuItem>
									<NavigationMenuTrigger>Company</NavigationMenuTrigger>
									<NavigationMenuContent>
										<div className="flex w-[420px] gap-0 p-3">
											<div className="flex flex-1 flex-col gap-1">
												{companyLinks.map((item, i) => (
													<ListItem key={i} {...item} />
												))}
											</div>
											<div className="flex flex-1 flex-col gap-1 border-l pl-3">
												{companyLinks2.map((item, i) => (
													<a
														key={i}
														href={item.href}
														className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
													>
														<item.icon className="size-4" />
														{item.title}
													</a>
												))}
											</div>
										</div>
									</NavigationMenuContent>
								</NavigationMenuItem>
								<NavigationMenuItem>
									<NavigationMenuLink
										href="#"
										className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
									>
										Pricing
									</NavigationMenuLink>
								</NavigationMenuItem>
							</NavigationMenuList>
						</NavigationMenu>
					</div>
				</div>

				<div className="hidden items-center gap-2 md:flex">
					<Button variant="ghost">Sign In</Button>
					<Button>Get Started</Button>
				</div>

				<button
					onClick={() => setOpen(!open)}
					className="md:hidden"
					aria-expanded={open}
					aria-controls="mobile-menu"
					aria-label="Toggle menu"
				>
					<MenuToggleIcon open={open} className="size-7" />
				</button>
			</div>
			<MobileMenu open={open}>
				<div className="space-y-4">
					<div className="space-y-2">
						<h3 className="text-sm font-medium text-muted-foreground">Product</h3>
						{productLinks.map((link) => (
							<a
								key={link.title}
								href={link.href}
								className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
							>
								<link.icon className="size-4 text-muted-foreground" />
								<div>
									<div className="font-medium">{link.title}</div>
									{link.description && (
										<p className="text-xs text-muted-foreground">{link.description}</p>
									)}
								</div>
							</a>
						))}
						<h3 className="text-sm font-medium text-muted-foreground pt-2">Company</h3>
						{companyLinks.map((link) => (
							<a
								key={link.title}
								href={link.href}
								className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
							>
								<link.icon className="size-4 text-muted-foreground" />
								<div>
									<div className="font-medium">{link.title}</div>
									{link.description && (
										<p className="text-xs text-muted-foreground">{link.description}</p>
									)}
								</div>
							</a>
						))}
						{companyLinks2.map((link) => (
							<a
								key={link.title}
								href={link.href}
								className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
							>
								<link.icon className="size-4 text-muted-foreground" />
								<span className="font-medium">{link.title}</span>
							</a>
						))}
					</div>
				</div>
				<div className="mt-auto flex flex-col gap-2 border-t pt-4">
					<Button variant="outline" className="w-full">
						Sign In
					</Button>
					<Button className="w-full">Get Started</Button>
				</div>
			</MobileMenu>
		</header>
	);
}

type MobileMenuProps = React.ComponentProps<'div'> & {
	open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
	if (!open || typeof window === 'undefined') return null;

	return createPortal(
		<div
			id="mobile-menu"
			className={cn(
				'fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col bg-background p-6 md:hidden',
				className,
			)}
			{...props}
		>
			<div className="flex-1 overflow-y-auto">{children}</div>
		</div>,
		document.body,
	);
}

function ListItem({
	title,
	description,
	icon: Icon,
	className,
	href,
	...props
}: React.ComponentProps<'a'> & LinkItem) {
	return (
		<a
			href={href}
			className={cn(
				'flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-accent',
				className,
			)}
			{...props}
		>
			<div className="mt-0.5 rounded-md border bg-background p-1.5 shadow-sm">
				<Icon className="size-4" />
			</div>
			<div className="space-y-1">
				<div className="text-sm font-medium leading-none">{title}</div>
				<p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
			</div>
		</a>
	);
}

const productLinks: LinkItem[] = [
	{
		title: 'Website Builder',
		href: '#',
		description: 'Create responsive websites with ease',
		icon: GlobeIcon,
	},
	{
		title: 'Cloud Platform',
		href: '#',
		description: 'Deploy and scale apps in the cloud',
		icon: LayersIcon,
	},
	{
		title: 'Team Collaboration',
		href: '#',
		description: 'Tools to help your teams work better together',
		icon: UserPlusIcon,
	},
	{
		title: 'Analytics',
		href: '#',
		description: 'Track and analyze your website traffic',
		icon: BarChart,
	},
	{
		title: 'Integrations',
		href: '#',
		description: 'Connect your apps and services',
		icon: PlugIcon,
	},
	{
		title: 'API',
		href: '#',
		description: 'Build custom integrations with our API',
		icon: CodeIcon,
	},
];

const companyLinks: LinkItem[] = [
	{
		title: 'About Us',
		href: '#',
		description: 'Learn more about our story and team',
		icon: Users,
	},
	{
		title: 'Customer Stories',
		href: '#',
		description: 'See how we\'ve helped our clients succeed',
		icon: Star,
	},
	{
		title: 'Partnerships',
		href: '#',
		icon: Handshake,
		description: 'Collaborate with us for mutual growth',
	},
];

const companyLinks2: LinkItem[] = [
	{
		title: 'Terms of Service',
		href: '#',
		icon: FileText,
	},
	{
		title: 'Privacy Policy',
		href: '#',
		icon: Shield,
	},
	{
		title: 'Refund Policy',
		href: '#',
		icon: RotateCcw,
	},
	{
		title: 'Blog',
		href: '#',
		icon: Leaf,
	},
	{
		title: 'Help Center',
		href: '#',
		icon: HelpCircle,
	},
];

function useScroll(threshold: number) {
	const [scrolled, setScrolled] = React.useState(false);

	const onScroll = React.useCallback(() => {
		setScrolled(window.scrollY > threshold);
	}, [threshold]);

	React.useEffect(() => {
		window.addEventListener('scroll', onScroll);
		return () => window.removeEventListener('scroll', onScroll);
	}, [onScroll]);

	React.useEffect(() => {
		onScroll();
	}, [onScroll]);

	return scrolled;
}

const WordmarkIcon = (props: React.ComponentProps<'svg'>) => (
	<svg
		viewBox="0 0 200 50"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...props}
	>
		<text
			x="0"
			y="38"
			fill="currentColor"
			fontSize="36"
			fontWeight="bold"
			fontFamily="system-ui, sans-serif"
		>
			Acme
		</text>
	</svg>
);
