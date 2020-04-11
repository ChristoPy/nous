import Manager from '../../src/core/Manager';
import { createConnection, Socket  } from 'net';
import helpers from '../helpers';
import Service from '../../src/core/Service';
import Token from '../../src/core/Token';
import { setTimeout } from 'timers';

describe('nous tests', () => {
    let manager: Manager;
    const PORT = 8080;
    let serviceOne: Service;
    let serviceTwo: Service;

    beforeAll(() => {
        manager = new Manager(PORT);
        manager.run();

        const [firstService, secondService] = helpers.upServices();
        serviceOne = firstService;
        serviceTwo = secondService;
    })

    afterAll(() => {
        manager.down();
        helpers.downServices([serviceOne, serviceTwo]);
    })

    test('should service was up correctly', () => {
        const socket = createConnection(serviceOne.port);
        const socket2 = createConnection(serviceTwo.port);
        
        expect(socket2.connecting).toBe(true);
        expect(socket.connecting).toBe(true);
        socket.destroy();
        socket2.destroy();
    });
    
    test('should have services registered', () => {
        expect(serviceOne.isRegistered).toBeTruthy();
        expect(serviceTwo.isRegistered).toBeTruthy();
    });

    test('should manager and services up', () => {
        expect(manager.server.listening).toBeTruthy();
        expect(serviceOne.server.listening).toBeTruthy();
        expect(serviceTwo.server.listening).toBeTruthy();
    });

    test('should send data to a service', (done) => {
        const client = createConnection({ port: manager.port  });
        client.write(JSON.stringify({
            service: 'HomeTest',
            action: 'data service',
            isService: false,
            payload: {
                action: 'hello',
                parameters: [
                    'John'
                ]
            }
        }));
        client.on('data', payload => {
            expect(payload.toString()).toBe("Hello John");
            done();
        });
    });

    test('should send data to second service', done => {
        const client = createConnection({port: manager.port});
        client.write(JSON.stringify({
            service: 'SecondTest',
            action: 'data service',
            isService: false,
            payload: {
                action: 'say',
                parameters: [
                    'John'
                ],
            }
        }));
        client.on('data', payload => {
            expect(payload.toString()).toBe("Aloha John");
            done();
        });
    })

    test('should manager have services on list', () => {
        expect(manager.services.length).toBeGreaterThan(0);
    });

    test('should send a message to all services to down server', () => {
        const token = new Token().getToken();
        const client = createConnection({ port: manager.port  });
        client.write(JSON.stringify({
            isService: false,
            action: 'down',
            payload: {
               from: token 
            }
        }));
    });

    test('should all services and manager down', (done) => {
        setTimeout(() => {
            expect(serviceOne.server.listening).toBeFalsy();
            expect(serviceOne.server.listening).toBeFalsy();
            expect(manager.server.listening).toBeFalsy();
            done();
        }, 3000);
    });
});