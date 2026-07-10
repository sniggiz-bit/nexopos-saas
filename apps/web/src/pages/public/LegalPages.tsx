import React from 'react';
import { PublicInfoPage } from '../../components/PublicInfoPage';

export function TerminosPage() {
  return (
    <PublicInfoPage title="Términos de Servicio">
      <div className="space-y-6">
        <p className="text-lg text-slate-300 leading-relaxed">
          Bienvenido a NexoPOS. Al utilizar nuestra plataforma, aceptas cumplir con los siguientes términos y condiciones.
          Estos términos rigen el uso de nuestro software de Punto de Venta y servicios relacionados.
        </p>
        <h3 className="text-xl font-semibold text-white mt-8">1. Uso del Servicio</h3>
        <p>
          NexoPOS provee una plataforma SaaS para la gestión de inventario, ventas y facturación electrónica. 
          Te comprometes a utilizar el servicio de manera legal y a proporcionar información veraz en tu registro.
        </p>
        <h3 className="text-xl font-semibold text-white mt-8">2. Suscripciones y Pagos</h3>
        <p>
          El acceso a ciertas funciones requiere una suscripción activa. Los pagos se procesan de forma segura y 
          se renuevan automáticamente según el ciclo de facturación elegido (mensual o anual).
        </p>
        <h3 className="text-xl font-semibold text-white mt-8">3. Disponibilidad</h3>
        <p>
          Nos esforzamos por mantener una disponibilidad del 99.9%. Sin embargo, podemos realizar ventanas de 
          mantenimiento programadas que serán notificadas con anticipación.
        </p>
        <div className="mt-12 p-6 bg-white/[0.03] border border-white/[0.08] rounded-xl">
          <p className="text-sm text-slate-400">Última actualización: {new Date().toLocaleDateString('es-CL')}</p>
        </div>
      </div>
    </PublicInfoPage>
  );
}

export function PrivacidadPage() {
  return (
    <PublicInfoPage title="Política de Privacidad">
      <div className="space-y-6">
        <p className="text-lg text-slate-300 leading-relaxed">
          En NexoPOS valoramos tu privacidad y nos tomamos muy en serio la protección de los datos de tu empresa 
          y de tus clientes.
        </p>
        <h3 className="text-xl font-semibold text-white mt-8">Recopilación de Datos</h3>
        <p>
          Recopilamos información necesaria para el funcionamiento del sistema POS, incluyendo datos de inventario,
          registros de ventas, información de facturación y datos de usuarios para el acceso a la plataforma.
        </p>
        <h3 className="text-xl font-semibold text-white mt-8">Protección y Seguridad</h3>
        <p>
          Todos tus datos son encriptados en tránsito (SSL/TLS) y en reposo. Utilizamos servidores de alta 
          seguridad (AWS) y realizamos respaldos automatizados continuos para garantizar que tu información esté 
          siempre a salvo frente a cualquier contingencia.
        </p>
        <h3 className="text-xl font-semibold text-white mt-8">Compartir Información</h3>
        <p>
          No vendemos ni compartimos tus datos comerciales con terceros bajo ninguna circunstancia. Solo 
          compartiremos la información estrictamente necesaria con entidades reguladoras (como el SII) cuando 
          esté directamente relacionado con tus operaciones de facturación electrónica.
        </p>
      </div>
    </PublicInfoPage>
  );
}

export function ContactoPage() {
  return (
    <PublicInfoPage title="Contacto Comercial">
      <div className="space-y-6 text-center md:text-left">
        <p className="text-lg text-slate-300 leading-relaxed">
          ¿Tienes dudas sobre los planes o quieres conversar con nuestro equipo comercial? 
          Estamos aquí para ayudarte a escalar tu comercio.
        </p>
        
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-white/[0.03] border border-white/[0.08] rounded-xl flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-bold text-white mb-2">Correo Comercial</h3>
            <a href="mailto:contacto@nexopos.cl" className="text-cyan-400 font-medium hover:underline text-lg">contacto@nexopos.cl</a>
            <p className="text-xs text-slate-500 mt-3">Respondemos en menos de 2 horas hábiles.</p>
          </div>
          <div className="p-6 bg-white/[0.03] border border-white/[0.08] rounded-xl flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-bold text-white mb-2">Oficina Central</h3>
            <p className="text-slate-300 font-medium">Santiago, Chile</p>
            <p className="text-xs text-slate-500 mt-3">Atención presencial previa coordinación.</p>
          </div>
        </div>
      </div>
    </PublicInfoPage>
  );
}

export function SoportePage() {
  return (
    <PublicInfoPage title="Centro de Soporte">
      <div className="space-y-6 text-center md:text-left">
        <p className="text-lg text-slate-300 leading-relaxed">
          Nuestro equipo de soporte técnico está listo para ayudarte con cualquier incidencia o duda 
          sobre el funcionamiento de NexoPOS.
        </p>
        
        <div className="mt-8 p-8 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg">
          <h3 className="text-2xl font-black text-white mb-4">¿Necesitas ayuda urgente?</h3>
          <p className="text-slate-300 mb-6">Escríbenos directamente a nuestro canal de soporte técnico 24/7.</p>
          <a 
            href="mailto:soporte@nexopos.cl" 
            className="inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors shadow-lg"
          >
            Enviar Email a Soporte (soporte@nexopos.cl)
          </a>
        </div>
      </div>
    </PublicInfoPage>
  );
}
