"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfinitePayProvider = void 0;
var InfinitePayProvider = /** @class */ (function () {
    function InfinitePayProvider() {
        this.handle = process.env.INFINITEPAY_HANDLE || '';
        this.redirectUrl = process.env.INFINITEPAY_REDIRECT_URL || '';
        this.webhookUrl = process.env.INFINITEPAY_WEBHOOK_URL || '';
    }
    InfinitePayProvider.prototype.createCheckoutSession = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var requestBody, safePayload, response, responseText, parsed, responseData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.handle) {
                            console.error('[Checkout] INFINITEPAY_HANDLE não configurado');
                            throw new Error('Gateway de pagamento não configurado');
                        }
                        requestBody = {
                            handle: this.handle,
                            order_nsu: payload.orderId,
                            redirect_url: this.redirectUrl || "http://localhost:3000/pedido/sucesso?order=".concat(payload.orderId),
                            webhook_url: this.webhookUrl || "http://localhost:3000/api/webhooks/infinitepay",
                            customer: payload.customer ? {
                                name: payload.customer.name,
                                email: payload.customer.email,
                                phone: payload.customer.phone.replace(/\D/g, ''),
                            } : undefined,
                            items: payload.items.map(function (item) { return ({
                                description: item.name,
                                quantity: item.quantity,
                                price: Math.round(item.price * 100), // preço unitário em centavos já recebido do service
                            }); })
                        };
                        console.log("[InfinitePay]");
                        console.log("NODE_ENV:", process.env.NODE_ENV);
                        console.log("Handle encontrado:", this.handle ? "Sim" : "Não");
                        console.log("Redirect encontrada:", this.redirectUrl ? "Sim" : "Não");
                        console.log("Webhook encontrada:", this.webhookUrl ? "Sim" : "Não");
                        safePayload = JSON.parse(JSON.stringify(requestBody));
                        safePayload.handle = "***MASKED***";
                        if (safePayload.customer) {
                            safePayload.customer.email = "***MASKED***";
                            safePayload.customer.phone = "***MASKED***";
                        }
                        console.log("[InfinitePay] Payload enviado:");
                        console.dir(safePayload, { depth: null });
                        console.log("[InfinitePay] Endpoint:", 'https://api.checkout.infinitepay.io/links');
                        console.log("[InfinitePay] Method: POST");
                        console.log("[InfinitePay] Headers:");
                        console.dir({ 'Content-Type': 'application/json' });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch('https://api.checkout.infinitepay.io/links', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(requestBody),
                            })];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.text()];
                    case 3:
                        responseText = _a.sent();
                        console.log("[InfinitePay] HTTP Status:", response.status);
                        console.log("[InfinitePay] Headers:");
                        console.dir(Object.fromEntries(response.headers.entries()));
                        console.log("[InfinitePay] Body:");
                        console.log(responseText);
                        parsed = void 0;
                        try {
                            parsed = JSON.parse(responseText);
                            console.dir(parsed, { depth: null });
                        }
                        catch (_b) {
                            console.log("Body não é JSON.");
                        }
                        if (!response.ok) {
                            console.error('[InfinitePay] Erro de API:', response.status, responseText);
                            throw new Error('Erro no gateway de pagamento');
                        }
                        responseData = parsed;
                        if (!responseData || !responseData.url) {
                            console.error('[Checkout] InfinitePay não retornou URL');
                            throw new Error('Gateway não retornou URL de pagamento');
                        }
                        return [2 /*return*/, {
                                paymentUrl: responseData.url,
                                referenceId: payload.orderId // Usamos orderId/NSU como referência para callbacks
                            }];
                    case 4:
                        error_1 = _a.sent();
                        console.error('[InfinitePay] Exceção na geração do checkout:', error_1);
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    InfinitePayProvider.prototype.verifyWebhookSignature = function (body, signature) {
        // A integração oficial por Links não utiliza API Keys/Secrets para validação de signature.
        // Confiaremos no webhook endpoint que trata a validação da origem via referenceId na base
        return true;
    };
    return InfinitePayProvider;
}());
exports.InfinitePayProvider = InfinitePayProvider;
