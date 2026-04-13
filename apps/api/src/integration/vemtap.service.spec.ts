import { Test, TestingModule } from '@nestjs/testing';
import { VemtapService } from './vemtap.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('VemtapService', () => {
  let service: VemtapService;
  let httpService: HttpService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'VEMTAP_API_URL') return 'http://localhost:3001/api/v1';
      if (key === 'VEMTAP_API_KEY') return 'test_key';
      return null;
    }),
  };

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VemtapService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<VemtapService>(VemtapService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchActivePlans', () => {
    it('should return plans on success', async () => {
      const plans = [{ id: '1', name: 'Plan 1' }];
      const response: Partial<AxiosResponse> = { data: plans };
      mockHttpService.get.mockReturnValue(of(response));

      const result = await service.fetchActivePlans();
      expect(result).toEqual(plans);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/plans?onlyActive=true',
        expect.any(Object),
      );
    });

    it('should return empty array on failure', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('API Error')));
      const result = await service.fetchActivePlans();
      expect(result).toEqual([]);
    });
  });

  describe('provisionUser', () => {
    it('should send correct payload to Vemtap', async () => {
      const payload = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        planId: 'vemtap_id',
      };
      const response: Partial<AxiosResponse> = { data: { success: true } };
      mockHttpService.post.mockReturnValue(of(response));

      await service.provisionUser(payload.email, payload.firstName, payload.lastName, payload.planId);

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/users/provision',
        payload,
        expect.any(Object),
      );
    });

    it('should handle errors gracefully without throwing', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('Provisioning failed')));
      await expect(
        service.provisionUser('test@example.com', 'John', 'Doe', 'id'),
      ).resolves.not.toThrow();
    });
  });
});
