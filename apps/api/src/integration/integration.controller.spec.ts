import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { QRCodesService } from '../qr-codes/qr-codes.service';
import { FormsService } from '../forms/forms.service';
import { LeadsQueryDto } from './dto/leads-query.dto';

describe('IntegrationController', () => {
  let controller: IntegrationController;
  let formsService: FormsService;

  const mockFormsService = {
    getLeadsForIntegration: jest.fn(),
  };

  const mockIntegrationService = {};
  const mockQRCodesService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationController],
      providers: [
        { provide: IntegrationService, useValue: mockIntegrationService },
        { provide: QRCodesService, useValue: mockQRCodesService },
        { provide: FormsService, useValue: mockFormsService },
      ],
    }).compile();

    controller = module.get<IntegrationController>(IntegrationController);
    formsService = module.get<FormsService>(FormsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSpecializedLeads', () => {
    it('should call formsService.getLeadsForIntegration with correct parameters', async () => {
      const userId = 'user-1';
      const query: LeadsQueryDto = { 
        page: 1, 
        limit: 10, 
        types: ['booking', 'menu'] 
      };
      
      mockFormsService.getLeadsForIntegration.mockResolvedValue({ items: [], meta: {} });
      
      const result = await controller.getSpecializedLeads(userId, query);
      
      expect(formsService.getLeadsForIntegration).toHaveBeenCalledWith(userId, query);
      expect(result).toBeDefined();
    });
  });
});
