import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '../services/api';
import toast from 'react-hot-toast';
import type { TicketStatus } from '../types/api';
import { useEffect } from 'react';
import { useSocket } from './useSocket';

export const useSupport = () => {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  // ─── User: My Ticket ────────────────────────────────────────────────────────
  const useMyTicket = (enabled = true) => {
    const query = useQuery({
      queryKey: ['myTicket'],
      queryFn: () => supportApi.getMyTicket(),
      enabled,
      retry: false,
      // Fallback poll every 5s — safety net if a WS event is missed
      refetchInterval: enabled ? 5000 : false,
    });

    const ticketId = query.data?.ticket?.id ?? null;

    useEffect(() => {
      // Need both socket connected AND ticketId to join a room
      if (!isConnected || !ticketId) return;

      console.log('[WS] Joining room for ticket:', ticketId);
      socket.emit('joinTicket', { ticketId });

      const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['myTicket'] });
      };

      socket.on('newMessage', invalidate);
      socket.on('statusUpdated', invalidate);

      return () => {
        socket.off('newMessage', invalidate);
        socket.off('statusUpdated', invalidate);
        socket.emit('leaveTicket', { ticketId });
        console.log('[WS] Left room for ticket:', ticketId);
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected, ticketId]);

    return query;
  };

  // ─── Admin: Ticket List ──────────────────────────────────────────────────────
  const useAdminTickets = (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    return useQuery({
      queryKey: ['adminTickets', params],
      queryFn: () => supportApi.getTickets(params),
      refetchInterval: 5000, // Poll ticket list every 5s
    });
  };

  // ─── Admin: Messages for selected ticket ────────────────────────────────────
  const useAdminTicketMessages = (ticketId: string | null) => {
    const query = useQuery({
      queryKey: ['adminTicketMessages', ticketId],
      queryFn: () => supportApi.getTicketMessages(ticketId!),
      enabled: !!ticketId,
      // Fallback poll every 5s — safety net if a WS event is missed
      refetchInterval: ticketId ? 5000 : false,
    });

    useEffect(() => {
      if (!isConnected || !ticketId) return;

      console.log('[WS] Admin joining room for ticket:', ticketId);
      socket.emit('joinTicket', { ticketId });

      const invalidateMessages = () => {
        queryClient.invalidateQueries({ queryKey: ['adminTicketMessages', ticketId] });
        queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
      };

      socket.on('newMessage', invalidateMessages);
      socket.on('statusUpdated', invalidateMessages);

      return () => {
        socket.off('newMessage', invalidateMessages);
        socket.off('statusUpdated', invalidateMessages);
        socket.emit('leaveTicket', { ticketId });
        console.log('[WS] Admin left room for ticket:', ticketId);
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected, ticketId]);

    return query;
  };

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const createTicketMutation = useMutation({
    mutationFn: (data: { guestName?: string; guestEmail?: string; subject?: string }) =>
      supportApi.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTicket'] });
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
    },
    onError: () => toast.error('Failed to create ticket'),
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ ticketId, text }: { ticketId: string; text: string }) =>
      supportApi.sendMessage(ticketId, text),
    onSuccess: (_, variables) => {
      // Invalidate immediately on success so sender sees their own message
      queryClient.invalidateQueries({ queryKey: ['myTicket'] });
      queryClient.invalidateQueries({ queryKey: ['adminTicketMessages', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
    },
    onError: () => toast.error('Failed to send message'),
  });

  const updateTicketStatusMutation = useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: TicketStatus }) =>
      supportApi.updateTicketStatus(ticketId, status),
    onSuccess: (_, variables) => {
      toast.success(`Ticket marked as ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['adminTicketMessages', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
      queryClient.invalidateQueries({ queryKey: ['myTicket'] });
    },
    onError: () => toast.error('Failed to update ticket status'),
  });

  return {
    socket,
    isConnected,
    useMyTicket,
    useAdminTickets,
    useAdminTicketMessages,
    createTicket: createTicketMutation.mutate,
    createTicketAsync: createTicketMutation.mutateAsync,
    isCreatingTicket: createTicketMutation.isPending,
    sendMessage: sendMessageMutation.mutate,
    sendMessageAsync: sendMessageMutation.mutateAsync,
    isSendingMessage: sendMessageMutation.isPending,
    updateTicketStatus: updateTicketStatusMutation.mutate,
    isUpdatingStatus: updateTicketStatusMutation.isPending,
  };
};
