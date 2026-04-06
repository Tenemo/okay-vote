type DatabaseErrorLike = {
    cause?: unknown;
    code?: string;
    constraint?: string;
};

const getDatabaseErrorLike = (error: unknown): DatabaseErrorLike | null => {
    if (!error || typeof error !== 'object') {
        return null;
    }

    const databaseError = error as DatabaseErrorLike;

    if (typeof databaseError.code === 'string') {
        return databaseError;
    }

    if (databaseError.cause && typeof databaseError.cause === 'object') {
        const nestedError = databaseError.cause as DatabaseErrorLike;

        if (typeof nestedError.code === 'string') {
            return nestedError;
        }
    }

    return databaseError;
};

export const isConstraintViolation = (
    error: unknown,
    constraint?: string,
): error is DatabaseErrorLike => {
    const databaseError = getDatabaseErrorLike(error);

    if (!databaseError || databaseError.code !== '23505') {
        return false;
    }

    return constraint ? databaseError.constraint === constraint : true;
};
