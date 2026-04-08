import { type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';

import Seo from 'components/Seo';

const NotFound = (): ReactElement => {
    const navigate = useNavigate();
    const onClick = (): void => {
        void navigate('/');
    };

    return (
        <>
            <Seo
                description="The requested okay.vote page could not be found."
                title="Page not found"
            />
            <div className="flex min-h-[50vh] items-center justify-center">
                <Panel className="max-w-xl text-center">
                    <div className="space-y-4">
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Page not found
                        </h1>
                        <p className="field-note">
                            Path <strong>{window.location.pathname}</strong> not
                            found.
                        </p>
                        <div className="flex justify-center">
                            <Button onClick={onClick} variant="outline">
                                Go back to vote creation
                            </Button>
                        </div>
                    </div>
                </Panel>
            </div>
        </>
    );
};

export default NotFound;
