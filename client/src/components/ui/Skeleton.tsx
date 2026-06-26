import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
}

const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div className={cn('h-4 w-full rounded-input skeleton', className)} />
  );
};

export default Skeleton;
