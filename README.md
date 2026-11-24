# En fase · Laboratorio PLL

Aplicación didáctica interactiva del Tema 5 de CSAF. Incluye la arquitectura del PLL, una respuesta temporal linealizada, las transferencias de fase de referencia y VCO y una comparación de detectores ideales de tipo multiplicador, XOR y PFD con bomba de carga.

El modelo de segundo orden y tipo II representa pequeñas perturbaciones alrededor del enganche. La referencia se compara con la fase de salida dividida por N. El desajuste inicial mostrado corresponde al VCO sin dividir y el salto ocurre en la referencia a los 30 µs. No representa captura global, límites de sintonía, conmutación ni deslizamientos de ciclo. La indicación de tolerancia es instantánea al final de la simulación.

Las curvas de ruido muestran ganancias de transferencia, no espectros absolutos. La referencia incluye N² en potencia. Los detectores se comparan con señales periódicas ideales de igual frecuencia y cada curva tiene su propia normalización. Las fuentes se indican en la propia web.

Para ejecutar la vista local usa `npm start` y abre http://127.0.0.1:4174. Las pruebas del modelo se ejecutan con `npm test`. No hay dependencias externas.

La vista temporal permite reproducir, pausar y recorrer el enganche. Los fasores muestran el error de fase calculado con una ampliación angular indicada en pantalla y su giro es esquemático. Un cursor sigue la misma simulación en las gráficas de frecuencia y error.
