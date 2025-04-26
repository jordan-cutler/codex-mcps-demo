flowchart TD
    %% Main External System
    SlackAPI[Slack API]:::external

    %% MCP Server and Main Components
    subgraph MCP Server Environment
        EnvConfig[Environment Configuration]:::config
        
        subgraph MCP Server Core
            Server[Server Instance]:::core
            Transport[StdioServerTransport]:::transport
            ErrorHandler[Error Handling]:::utility
        end
        
        subgraph Tool Registry
            ListTools[List Tools Handler]:::handler
            CallTools[Call Tool Handler]:::handler
            
            subgraph Slack Tools
                Channels[Channel Tools]:::tool
                Messages[Message Tools]:::tool
                Reactions[Reaction Tools]:::tool
                Users[User Tools]:::tool
            end
        end
        
        subgraph Slack Client
            ClientAuth[Authentication]:::auth
            APIWrapper[API Wrapper Methods]:::wrapper
            ResponseHandling[Response Handling]:::utility
        end
    end

    %% Connections between components
    SlackAPI <-->|API Requests/Responses| APIWrapper
    EnvConfig -->|Provides Credentials| ClientAuth
    Server -->|Initializes| Transport
    Server -->|Registers| ListTools
    Server -->|Registers| CallTools
    ListTools -->|Returns Tool Definitions| Channels
    ListTools -->|Returns Tool Definitions| Messages
    ListTools -->|Returns Tool Definitions| Reactions
    ListTools -->|Returns Tool Definitions| Users
    CallTools -->|Dispatches Request| APIWrapper
    ClientAuth -->|Authenticates| APIWrapper
    APIWrapper -->|Formats| ResponseHandling
    ErrorHandler -->|Handles Errors From| APIWrapper

    %% Styles
    classDef external fill:#f9a,stroke:#333,stroke-width:2px
    classDef core fill:#9cf,stroke:#333,stroke-width:2px
    classDef transport fill:#9cf,stroke:#333,stroke-width:1px
    classDef config fill:#fcf,stroke:#333,stroke-width:1px
    classDef handler fill:#cfc,stroke:#333,stroke-width:1px
    classDef tool fill:#cfc,stroke:#333,stroke-width:1px,opacity:0.7
    classDef auth fill:#ff9,stroke:#333,stroke-width:1px
    classDef wrapper fill:#ff9,stroke:#333,stroke-width:1px,opacity:0.7
    classDef utility fill:#ddd,stroke:#333,stroke-width:1px

    %% Click Events
    click Server folder-samples/slack/index.ts
    click EnvConfig folder-samples/slack/index.ts
    click ListTools folder-samples/slack/index.ts
    click ClientAuth folder-samples/slack/index.ts
    click APIWrapper folder-samples/slack/index.ts
    click SlackAPI folder-samples/slack/index.ts
