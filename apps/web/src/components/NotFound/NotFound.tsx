import { type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';

const NotFound = (): ReactElement => {
    const navigate = useNavigate();
    const onClick = (): void => {
        void navigate('/');
    };

    return (
        <div className="flex h-[50%] items-center justify-center px-4">
            <div className="flex flex-col items-center justify-center text-center">
                <p>
                    Path <strong>{window.location.pathname}</strong> not found.
                </p>
                <Button className="mt-4" onClick={onClick} variant="outline">
                    Go back to vote creation
                </Button>
            </div>
        </div>
    );
};

export default NotFound;
