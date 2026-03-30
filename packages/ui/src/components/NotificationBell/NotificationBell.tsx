import { Bell } from 'lucide-react';
import { Avatar, AvatarFallback } from '../avatar';
import { Badge } from '../badge';

interface Props {
    count: number;
}

const NotificationBell = ({ count }: Props) => {
    const label = count > 99 ? "99+" : String(count);

    return (
        <div className="relative w-fit">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {count > 0 && (
                <Badge className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 py-0 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none border-2 border-background pointer-events-none">
                    {label}
                </Badge>
            )}
        </div>
    );
}