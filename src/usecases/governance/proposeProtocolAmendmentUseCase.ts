import { ProtocolAmendment, ProtocolAmendmentStatus, Vote, VoteType } from '../../domain/governance';
import { ProtocolRepository } from '../../domain/repositories/protocolRepository';
import { UserRepository } from '../../domain/repositories/userRepository';
import { ProtocolAmendmentRepository } from '../../domain/repositories/protocolAmendmentRepository';
import { DomainError } from '../../errors/domainError';

export class ProposeProtocolAmendmentUseCase {
  constructor(
    private readonly protocolRepository: ProtocolRepository,
    private readonly userRepository: UserRepository,
    private readonly protocolAmendmentRepository: ProtocolAmendmentRepository,
  ) {}

  async execute(
    proposerId: string,
    title: string,
    description: string,
    proposedChanges: string,
  ): Promise<ProtocolAmendment> {
    // 1. Validate proposer
    const proposer = await this.userRepository.findById(proposerId);
    if (!proposer) {
      throw new DomainError('Proposer not found.');
    }

    // 2. Get current protocol version (optional, but good for context)
    const currentProtocol = await this.protocolRepository.getCurrentProtocol();
    if (!currentProtocol) {
      throw new DomainError('Current protocol not found.');
    }

    // 3. Create a new protocol amendment
    const newAmendment = new ProtocolAmendment({
      id: this.protocolAmendmentRepository.generateId(),
      title,
      description,
      proposedChanges,
      proposerId,
      status: ProtocolAmendmentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      votes: [],
      currentProtocolVersion: currentProtocol.version,
    });

    // 4. Save the new amendment
    await this.protocolAmendmentRepository.save(newAmendment);

    return newAmendment;
  }
}

export class VoteOnProtocolAmendmentUseCase {
  constructor(
    private readonly protocolAmendmentRepository: ProtocolAmendmentRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    userId: string,
    amendmentId: string,
    voteType: VoteType,
  ): Promise<ProtocolAmendment> {
    // 1. Validate user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new DomainError('User not found.');
    }

    // 2. Find the amendment
    const amendment = await this.protocolAmendmentRepository.findById(amendmentId);
    if (!amendment) {
      throw new DomainError('Protocol amendment not found.');
    }

    // 3. Check if voting is still open
    if (amendment.status !== ProtocolAmendmentStatus.PENDING) {
      throw new DomainError('Voting is not open for this amendment.');
    }

    // 4. Check if user has already voted
    const existingVote = amendment.votes.find(vote => vote.userId === userId);
    if (existingVote) {
      throw new DomainError('User has already voted on this amendment.');
    }

    // 5. Create and add the new vote
    const newVote = new Vote({
      id: this.protocolAmendmentRepository.generateVoteId(),
      userId,
      voteType,
      votedAt: new Date(),
    });
    amendment.votes.push(newVote);

    // 6. Update amendment status if voting threshold is met (example logic)
    // This is a simplified example. Real-world scenarios might involve quorum,
    // specific voting periods, and more complex approval logic.
    const totalVotes = amendment.votes.length;
    const yesVotes = amendment.votes.filter(vote => vote.voteType === VoteType.YES).length;
    const requiredApprovalPercentage = 0.6; // Example: 60% approval

    if (totalVotes > 0 && (yesVotes / totalVotes) >= requiredApprovalPercentage) {
      amendment.status = ProtocolAmendmentStatus.APPROVED;
    } else if (totalVotes >= 10 && (yesVotes / totalVotes) < 0.4) { // Example: If 10 votes cast and less than 40% yes, reject
      amendment.status = ProtocolAmendmentStatus.REJECTED;
    }

    amendment.updatedAt = new Date();

    // 7. Save the updated amendment
    await this.protocolAmendmentRepository.save(amendment);

    return amendment;
  }
}

export class GetProtocolAmendmentUseCase {
  constructor(private readonly protocolAmendmentRepository: ProtocolAmendmentRepository) {}

  async execute(amendmentId: string): Promise<ProtocolAmendment | null> {
    return this.protocolAmendmentRepository.findById(amendmentId);
  }
}

export class ListProtocolAmendmentsUseCase {
  constructor(private readonly protocolAmendmentRepository: ProtocolAmendmentRepository) {}

  async execute(status?: ProtocolAmendmentStatus): Promise<ProtocolAmendment[]> {
    return this.protocolAmendmentRepository.findAll(status);
  }
}