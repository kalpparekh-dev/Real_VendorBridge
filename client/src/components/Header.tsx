import { Menu, Bell } from 'lucide-react';
import { cn } from '../utils/cn';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

const Header = ({ onMenuClick, title }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg-base/95 backdrop-blur supports-[backdrop-filter]:bg-bg-base/60">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-input p-2 text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
        >
          <Menu size={20} />
        </button>
        
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        
        <div className="ml-auto flex items-center gap-2">
          <button className="relative rounded-input p-2 text-text-secondary hover:bg-bg-elevated hover:text-text-primary">
            <Bell size={20} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
