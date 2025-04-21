```diagram-ai
title: mcp-server-git Architecture
description: Architecture diagram of the Git MCP server for repository interaction and automation
style: data-flow

component GitMCPServer {
  description: "Model Context Protocol server for Git operations"
  icon: git

  component ServerCore {
    description: "Core server implementation"
  }

  component GitOperations {
    description: "Git command implementations"
    
    component StatusTools {
      description: "View repository status"
      items: [
        "git_status - Shows working tree status",
        "git_diff_unstaged - Shows changes not yet staged",
        "git_diff_staged - Shows changes staged for commit",
        "git_diff - Shows differences between branches/commits"
      ]
    }
    
    component ModificationTools {
      description: "Modify repository state"
      items: [
        "git_add - Stages file contents",
        "git_commit - Records changes to repository",
        "git_reset - Unstages staged changes"
      ]
    }
    
    component BranchTools {
      description: "Branch management"
      items: [
        "git_create_branch - Creates new branch",
        "git_checkout - Switches branches"
      ]
    }
    
    component HistoryTools {
      description: "View repository history"
      items: [
        "git_log - Shows commit logs",
        "git_show - Shows contents of commits"
      ]
    }
    
    component SetupTools {
      description: "Repository setup"
      items: [
        "git_init - Initializes Git repository"
      ]
    }
  }
}

component Client {
  description: "Client applications using the Git MCP server"
  
  component ClaudeDesktop {
    description: "Claude Desktop integration"
  }
  
  component ZedEditor {
    description: "Zed editor integration"
  }
  
  component DevTools {
    description: "Development & debugging tools"
    items: [
      "MCP Inspector"
    ]
  }
}

connection GitMCPServer -> Client {
  description: "Provides Git operations via Model Context Protocol"
}

deployment Deployment {
  description: "Deployment options for Git MCP server"
  
  component UVDeployment {
    description: "Deployment using uv/uvx"
    highlight: true
  }
  
  component PipDeployment {
    description: "Deployment using pip"
  }
  
  component DockerDeployment {
    description: "Deployment using Docker"
  }
}

note {
  content: "The Git MCP server provides tools to read, search, and manipulate Git repositories via Large Language Models, enabling Git automation through natural language."
  position: bottom
}
```