'use client';

import { useState } from 'react';
import { customOrdersService } from '@/services/custom-orders.service';
import { CreateCustomOrderPayload } from '@/types/custom-orders';
import { storageService } from '@/services/storage.service';
import toast from 'react-hot-toast';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5575988313060';

function formatWhatsAppMessage(data: CreateCustomOrderPayload) {
  let message = `Olá! Gostaria de solicitar um orçamento personalizado para a seguinte joia:\n\n`;

  if (data.customer_name) message += `*Nome:* ${data.customer_name}\n`;
  message += `*Modelo:* ${data.model}\n`;
  message += `*Comprimento:* ${data.length}\n`;
  message += `*Espessura:* ${data.thickness}\n`;
  message += `*Material:* ${data.material}\n\n`;

  if (data.notes) {
    message += `*Observações:*\n${data.notes}\n\n`;
  }

  message += `Poderiam me informar:\n- valor final\n- prazo de produção\n- prazo de entrega\n\nObrigado!`;

  return encodeURIComponent(message);
}

export function useCustomOrder() {
  const [loading, setLoading] = useState(false);

  const submitOrder = async (
    payload: CreateCustomOrderPayload,
    imageFile?: File | null
  ) => {
    setLoading(true);

    try {
      let referenceImageUrl = '';

      if (imageFile) {
        // Upload the image
        const url = await storageService.uploadCustomOrderReference(imageFile, imageFile.name);
        if (url) {
          referenceImageUrl = url;
        }
      }

      const finalPayload: CreateCustomOrderPayload = {
        ...payload,
        reference_image: referenceImageUrl || undefined,
      };

      // Save to Supabase
      await customOrdersService.createOrder(finalPayload);

      // Generate WhatsApp Link
      const message = formatWhatsAppMessage(finalPayload);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

      // Open WhatsApp in a new tab
      window.open(whatsappUrl, '_blank');

      toast.success('Pedido enviado com sucesso!');
      return true;
    } catch (error) {
      console.error('Error submitting custom order:', error);
      toast.error('Erro ao enviar pedido. Tente novamente.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    submitOrder,
    loading
  };
}
