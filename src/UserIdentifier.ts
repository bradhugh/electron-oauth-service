/// <summary>
/// Indicates the type of <see cref=" UserIdentifier"/>
/// </summary>
export enum UserIdentifierType {
    /// <summary>
    /// When a <see cref=" UserIdentifier"/> of this type is passed in a token acquisition operation,
    /// the operation is guaranteed to return a token issued for the user with corresponding
    /// <see cref=" UserIdentifier.UniqueId"/> or fail.
    /// </summary>
    UniqueId,

    /// <summary>
    /// When a <see cref=" UserIdentifier"/> of this type is passed in a token acquisition operation,
    /// the operation restricts cache matches to the value provided and injects it as a hint
    /// in the authentication experience. However the end user could overwrite that value, resulting
    /// in a token issued to a different account than the one specified in the <see cref=" UserIdentifier"/> in input.
    /// </summary>
    OptionalDisplayableId,

    /// <summary>
    /// When a <see cref=" UserIdentifier"/> of this type is passed in a token acquisition operation,
    /// the operation is guaranteed to return a token issued for the user with corresponding
    /// <see cref=" UserIdentifier.DisplayableId"/> (UPN or email) or fail
    /// </summary>
    RequiredDisplayableId,
}

/// <summary>
/// Contains identifier for a user.
/// </summary>
export class UserIdentifier {

    /// <summary>
    /// Gets an static instance of <see cref="UserIdentifier"/> to represent any user.
    /// </summary>
    public static get anyUser(): UserIdentifier {
        return UserIdentifier.anyUserSingleton;
    }

    private static anyUserId = "AnyUser";

    private static anyUserSingleton = new UserIdentifier(
        UserIdentifier.anyUserId,
        UserIdentifierType.OptionalDisplayableId);

    constructor(public id: string, public type: UserIdentifierType) {
        if (!id) {
            throw new Error("id cannot be null");
        }
    }

    public get isAnyUser(): boolean {
        return (this.type === UserIdentifier.anyUser.type && this.id === UserIdentifier.anyUser.id);
    }

    public get uniqueId(): string {
        return (!this.isAnyUser && this.type === UserIdentifierType.UniqueId) ? this.id : null;
    }

    public get displayableId(): string {
        return (!this.isAnyUser && (this.type === UserIdentifierType.OptionalDisplayableId ||
                                    this.type === UserIdentifierType.RequiredDisplayableId))
            ? this.id
            : null;
    }
}
