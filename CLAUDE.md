# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Multi-Agent Development System** designed for coordinated software development using specialized AI agents. The system implements a comprehensive framework for team-based software development với defined roles, responsibilities, và coordination protocols.

**Core Philosophy**: Leverage specialized agent expertise for complex software projects while maintaining clear coordination và quality standards.

## 📋 MANDATORY DUAL-LEVEL TODO SYSTEM

**⚠️ CRITICAL WORKFLOW RULE**: All agents MUST use the dual-level todo system for optimal task management. This maintains both strategic project focus và tactical daily responsiveness.

### Dual-Level Todo Structure (MANDATORY)

**Two integrated todo systems:**

1. **📊 Project Level (`todo/todo.md`)** - Strategic work:
   - Major features và projects
   - Phase-based development
   - Multi-agent coordination
   - Long-term planning (weeks/months)

2. **⚡ Daily Level (`todo/daily-todo.md`)** - Tactical work:
   - Bug fixes và maintenance
   - Quick improvements
   - Urgent issues
   - Short-term tasks (hours/days)

3. **🔍 Validation Requirements**:
   - All agents' todos must be current (updated within last project)
   - No "pending" high-priority items from previous projects
   - Clear task assignments và deadlines
   - Dependencies between agents clearly identified

### Enforcement Rules

**🚫 PROJECT BLOCKING CONDITIONS:**
- If any agent's todos are outdated (>1 project cycle)
- If high-priority tasks remain unresolved from previous projects
- If task assignments are unclear or missing
- If agent dependencies are not properly coordinated

**✅ PROJECT APPROVAL CONDITIONS:**
- All agents have updated their todos
- Previous project tasks are properly completed/archived
- New project tasks are clearly defined và assigned
- Inter-agent dependencies are documented
- Timeline và priorities are set

### Dual-Level Management Responsibilities

**Alex (Project Manager)**:
- **MANDATORY**: Coordinate both `todo/todo.md` và `todo/daily-todo.md`
- Balance 70% project work + 30% daily tasks across team
- Escalate daily tasks to project level when needed
- Ensure agents maintain proper task classification

**Individual Agents (Sarah, Mike, Emma, David, Doc)**:
- **MANDATORY**: Work from both todo levels daily
- Update task status in both files as appropriate
- Follow task classification rules (Project vs Daily)
- Escalate when daily tasks grow beyond 8h scope

### Consequences of Non-Compliance

- **Project Execution BLOCKED** until todos are updated
- **Agent coordination SUSPENDED** for non-compliant agents
- **Quality gates FAILED** if todos don't reflect actual work
- **Documentation INCOMPLETE** without proper todo tracking

### Dual-Level System Integration

- **Morning Planning**: Review both `todo/todo.md` và `todo/daily-todo.md`
- **Daily Standup**: Report progress from both levels
- **Task Balance**: 70% project work + 30% daily maintenance
- **Escalation**: Daily tasks → Project when complexity grows
- **Quality Gates**: Both levels must meet completion criteria

## Agent Team Structure

### 🎯 Core Development Agents (5)

**Alex - Project Manager Agent**
- **Role**: Overall project coordination, sprint planning, risk management
- **Config**: `.claude/agents/alex.json`
- **Todo**: `todos/agents/alex-todo.md`
- **Focus**: Team productivity, stakeholder communication, blocker resolution

**Sarah - Frontend Agent**  
- **Role**: Chrome Extension development, UI/UX, browser APIs
- **Config**: `.claude/agents/sarah.json`
- **Todo**: `todos/agents/sarah-todo.md`
- **Focus**: User-facing functionality, DOM manipulation, content scripts

**Mike - Backend Agent**
- **Role**: MCP Server development, WebSocket implementation, API design
- **Config**: `.claude/agents/mike.json`
- **Todo**: `todos/agents/mike-todo.md`
- **Focus**: Server architecture, database design, performance optimization

**Emma - Fullstack Agent**
- **Role**: CLI tool development, system integration, DevOps
- **Config**: `.claude/agents/emma.json`
- **Todo**: `todos/agents/emma-todo.md`
- **Focus**: Component integration, deployment automation, development workflows

**David - QA Agent**
- **Role**: Testing strategy, quality assurance, E2E testing với Puppeteer
- **Config**: `.claude/agents/david.json`
- **Todo**: `todos/agents/david-todo.md`
- **Focus**: Quality gates, automated testing, performance validation

### 📚 Support Agent (1)

**Doc - Documentation Agent**
- **Role**: Technical documentation, API docs, user guides
- **Config**: `.claude/agents/doc.json`
- **Todo**: `todos/agents/doc-todo.md`
- **Focus**: Knowledge management, documentation maintenance, team communication

## Agent Coordination System

### Handoff Protocols
- **File**: `protocols/handoff-protocol.yaml`
- **Purpose**: Define structured workflows between agents
- **Key Protocols**: Frontend-Backend coordination, QA integration, documentation handoffs

### Conflict Resolution
- **File**: `protocols/conflict-resolution.yaml`
- **Purpose**: Systematic approach to resolving inter-agent conflicts
- **Coverage**: Technical disagreements, resource contention, quality vs speed tensions

### Communication Patterns
- **Async**: Slack-style channels for different discussion types
- **Sync**: Daily standups, integration meetings, quality reviews
- **Escalation**: 4-level escalation path for unresolved conflicts

## Commands

### Agent Management
```bash
# View agent configurations
cat .claude/agents/*.json

# Review todo system
cat todo/TODO.md
cat todo/DAILY-TODO.md
```

### Todo Management
```bash
# Project-level todos (strategic)
cat todo/TODO.md

# Daily planning (tactical)
cat todo/DAILY-TODO.md

# Check both levels
ls -la todo/
```

## Development Workflow

### Sprint Planning (Alex leads)
1. **Backlog Review**: Prioritize features với stakeholder input
2. **Task Decomposition**: Break epics into agent-specific tasks
3. **Capacity Planning**: Assign tasks based on agent expertise
4. **Dependency Mapping**: Identify inter-agent coordination needs
5. **Timeline Setting**: Establish sprint goals và success criteria

### Daily Operations
1. **Standup (9:00 AM)**: Progress updates, blockers, coordination needs
2. **Development Work**: Parallel agent work với defined interfaces
3. **Integration Points**: Coordinated handoffs per protocol
4. **Quality Gates**: David validates components continuously
5. **Documentation**: Doc updates materials in real-time

### Integration Approach
- **Frontend-Backend**: Contract-driven development với mock/real data transition
- **CLI Integration**: Emma orchestrates system-wide coordination
- **Testing**: David provides continuous quality validation
- **Documentation**: Doc maintains current technical và user-facing docs

## Architecture Principles

### Agent Specialization
- **Deep Expertise**: Each agent focuses on specific domain
- **Clear Boundaries**: Defined responsibility areas prevent overlap
- **Collaborative Interfaces**: Well-defined handoff points

### Coordination Mechanisms
- **Protocol-Driven**: Structured workflows reduce friction
- **Escalation Paths**: Clear conflict resolution procedures
- **Feedback Loops**: Continuous improvement through retrospectives

### Quality Assurance
- **Embedded QA**: David participates throughout development
- **Multiple Validation**: Technical, functional, và user experience testing
- **Performance Focus**: Continuous monitoring và optimization

## Quality Standards

### Code Quality
- **Coverage**: >80% test coverage across all components
- **Performance**: Meet defined benchmarks for response time và throughput
- **Security**: Zero critical vulnerabilities in production
- **Maintainability**: Clear architecture với documented decisions

### Process Quality
- **Communication**: Response times <24 hours for coordination requests
- **Conflict Resolution**: <72 hours average resolution time
- **Documentation**: 100% feature coverage với <30 day freshness
- **Integration**: >90% first-time integration success rate

## Advanced Features

### Agent Learning & Evolution
- **Performance Metrics**: Track individual agent productivity và quality
- **Skill Development**: Continuous learning through project experience
- **Process Optimization**: Regular retrospectives drive workflow improvements

### Scalability Considerations
- **Team Expansion**: Framework supports additional specialized agents
- **Workload Balancing**: Dynamic task allocation based on capacity
- **Tool Integration**: Extensible architecture for new development tools

## Golden Rules for Multi-Agent Development

### 1. Agent Role Specialization
Each agent must operate within their defined expertise domain and coordinate through established protocols.

### 2. Dual-Level Todo Management
All agents MUST maintain both project-level (`todo/TODO.md`) and daily-level (`todo/DAILY-TODO.md`) task tracking.

### 3. Quality Gate Compliance
No component integration without passing David's quality validation and E2E test coverage.

### 4. Protocol-Driven Coordination
All inter-agent communication must follow established handoff protocols in `protocols/`.

### 5. Clear Dependency Mapping
Document all inter-agent dependencies before beginning development work.

### 6. Real-Time Progress Updates
Update todo status immediately upon task completion - no batch updates.

### 7. Escalation Path Adherence
Follow 4-level escalation for unresolved conflicts: Agent → Lead → Project Manager → Stakeholder.

### 8. Performance Target Compliance
Meet defined benchmarks: CLI-to-Browser <2000ms, >95% success rate, >80% test coverage.

### 9. Security-First Development
Zero critical vulnerabilities in production, validate all external inputs.

### 10. Continuous Integration
Validate complete workflow end-to-end before marking tasks complete.

### 11. Document Always
**Every code change MUST include corresponding documentation updates. No exceptions.**
- Update technical docs in `docs/` when changing system behavior
- Update user guides when changing CLI commands or workflows
- Update API documentation when modifying server endpoints
- Update troubleshooting guides when adding new features
- Keep README files current with actual system capabilities

---

**Usage Notes for Claude Code:**
- When working on this project, identify which agent role best fits the task
- Follow established handoff protocols for inter-component work
- Escalate conflicts using defined resolution framework
- Maintain documentation standards throughout development (Golden Rule #11)
- Consider the multi-agent coordination impact of all architectural decisions