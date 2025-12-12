import { PaymentIntent, PaymentMethod } from '../../domain/entities';
import { PaymentGateway } from '../../domain/services/PaymentGateway';
import { PaymentIntentRepository } from '../../domain/repositories/PaymentIntentRepository';
import { CreatePaymentIntentRequestDTO, CreatePaymentIntentResponseDTO } from '../dtos/CreatePaymentIntentDTO';
import { Either, left, right } from '../../../shared/core/Either';
import { AppError } from '../../../shared/core/AppError';
import { Result } from '../../../shared/core/Result';
import { UniqueEntityID } from '../../../shared/domain/UniqueEntityID';

export class CreatePaymentIntent {
  private paymentGateway: PaymentGateway;
  private paymentIntentRepository: PaymentIntentRepository;

  constructor(paymentGateway: PaymentGateway, paymentIntentRepository: PaymentIntentRepository) {
    this.paymentGateway = paymentGateway;
    this.paymentIntentRepository = paymentIntentRepository;
  }

  public async execute(request: CreatePaymentIntentRequestDTO): Promise<Either<AppError.UnexpectedError | AppError.InvalidArgumentError, Result<CreatePaymentIntentResponseDTO>>> {
    try {
      const paymentMethodOrError = PaymentMethod.create(request.paymentMethod);

      if (paymentMethodOrError.isFailure) {
        return left(new AppError.InvalidArgumentError(paymentMethodOrError.errorValue()));
      }

      const paymentMethod: PaymentMethod = paymentMethodOrError.getValue();

      const paymentIntentOrError = PaymentIntent.create({
        amount: request.amount,
        currency: request.currency,
        customerId: request.customerId,
        paymentMethod: paymentMethod,
        status: 'pending', // Initial status
        createdAt: new Date(),
        updatedAt: new Date(),
      }, new UniqueEntityID(request.id));

      if (paymentIntentOrError.isFailure) {
        return left(new AppError.InvalidArgumentError(paymentIntentOrError.errorValue()));
      }

      const paymentIntent: PaymentIntent = paymentIntentOrError.getValue();

      const gatewayResponse = await this.paymentGateway.createPaymentIntent({
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.paymentMethod.value,
      });

      if (gatewayResponse.isLeft()) {
        return left(new AppError.UnexpectedError(gatewayResponse.value.message));
      }

      paymentIntent.gatewayId = gatewayResponse.value.paymentIntentId;

      await this.paymentIntentRepository.save(paymentIntent);

      return right(Result.ok<CreatePaymentIntentResponseDTO>({
        paymentIntentId: paymentIntent.id.toString(),
        gatewayId: paymentIntent.gatewayId,
        status: paymentIntent.status,
      }));

    } catch (error) {
      console.error(error);
      return left(new AppError.UnexpectedError(error.toString()));
    }
  }
}