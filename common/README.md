`
# Chat Application Node Module

This Node module provides TypeScript interfaces and types for building a chat application. It includes definitions for user authentication, user profiles, messages, rooms, and more.

## Installation

To install this package, you can use npm or yarn:

```bash
npm install chat-application-node-module
```

or

```bash
yarn add chat-application-node-module
```

## Usage

Import the interfaces and types you need from the package into your TypeScript files. For example:

```typescript
import { UserI, MessageI, Action } from 'chat-application-node-module';

// Now you can use UserI, MessageI, Action, and other types in your code
```

## Interfaces and Types

### User Interfaces

- `UserI`: Defines the structure of a user object, including id, name, email, password, and optional image.
- `DecodedUser`: Defines the structure of a decoded user object, including id and name.
- `userProfileT`: Represents a subset of UserI properties (name, email, id), typically used for user profiles.

### Input Validation

- `LoginInput`: Zod schema defining the structure of input data for user login, including email and password.
- `RegisterInput`: Zod schema defining the structure of input data for user registration, including name, email, and password.
- `CredentialsI`: Defines the structure of credentials required for actions like login and registration, including email and password.

### Messages and Rooms

- `MessageI`: Defines the structure of a chat message, including id, message content, sender and receiver IDs, room ID, image (optional), and creation timestamp.
- `dataI`: Defines the structure of data containing messages, typically used for storing messages associated with a user or a room.
- `roomsI`: Defines the structure of a chat room, including id, room name, creator ID, participant ID, and associated user objects for creator and participant.

### Other

- `Action`: Enum defining different actions like login and register.
- `HomeChildProps`: Defines props passed to a component in the home screen, including a socket connection.

## Contributing

Contributions are welcome! If you have any suggestions, improvements, or bug fixes, feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
