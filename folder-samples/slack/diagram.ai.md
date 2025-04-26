graph TD
    %% Main Components
    Client[Client Application]:::client
    Transport[Transport Layer]:::transport
    MCP[MCP Server]:::server
    SlackAPI[Slack API]:::external

    %% Subgraphs for logical grouping
    subgraph MCP Server Components
        ConfigMgmt[Configuration Management]:::config
        SlackClient[Slack Client]:::client
        ToolDefs[Tool Definitions]:::tooldef
        ReqHandlers[Request Handlers]:::handler
    end

    subgraph Tool Definitions
        Channels[Channel Tools]:::tool
        Messages[Message Tools]:::tool
        Users[User Tools]:::tool
        Reactions[Reaction Tools]:::tool
    end

    %% Detailed tool groups
    subgraph Channel Tools
        ListChannels[slack_list_channels]:::tool
        GetHistory[slack_get_channel_history]:::tool
    end

    subgraph Message Tools
        PostMsg[slack_post_message]:::tool
        ReplyThread[slack_reply_to_thread]:::tool
        ThreadReplies[slack_get_thread_replies]:::tool
    end

    subgraph User Tools
        GetUsers[slack_get_users]:::tool
        GetProfile[slack_get_user_profile]:::tool
    end

    subgraph Reaction Tools
        AddReaction[slack_add_reaction]:::tool
    end

    %% Connections
    Client -->|1.Sends Requests|Transport
    Transport -->|2.Forwards Requests|MCP
    MCP -->|3.Processes Requests|ReqHandlers
    ReqHandlers -->|4.Calls Methods|SlackClient
    SlackClient -->|5.Makes API Calls|SlackAPI
    SlackAPI -->|6.Returns Data|SlackClient
    SlackClient -->|7.Processes Responses|ReqHandlers
    ReqHandlers -->|8.Returns Results|MCP
    MCP -->|9.Formats Response|Transport
    Transport -->|10.Delivers Response|Client

    %% Configuration Management
    ConfigMgmt -->|Provides Settings|SlackClient
    ToolDefs -->|Defines Available Tools|ReqHandlers

    %% Style definitions
    classDef client fill:#C3E5E9,stroke:#333,stroke-width:1px
    classDef server fill:#FFDBAA,stroke:#333,stroke-width:1px
    classDef transport fill:#D6E8FF,stroke:#333,stroke-width:1px
    classDef external fill:#FFD6E7,stroke:#333,stroke-width:1px
    classDef config fill:#C3E4A2,stroke:#333,stroke-width:1px
    classDef handler fill:#FAF5D0,stroke:#333,stroke-width:1px
    classDef tooldef fill:#E5D4FF,stroke:#333,stroke-width:1px
    classDef tool fill:#B5E8D5,stroke:#333,stroke-width:1px
