/**
 * @file Event processor test suite
 * @author Paul Brachmann
 * @license Copyright (c) 2017 Malpaux IoT All Rights Reserved.
 */

import EventProcessor from './eventprocessor';

describe('event processor', () => {
  it('should create a new event processor', () => {
    expect(new EventProcessor());
    expect(new EventProcessor({}));
    expect(new EventProcessor({ key: 'value' }));
  });

  it('should get a value from the event processor\'s state', () => {
    expect(new EventProcessor().get('key')).toBe(undefined);
    expect(new EventProcessor({ key: 'value' }).get('key')).toBe('value');
  });

  it('should set a value in the event processor\'s state', () => {
    expect(new EventProcessor().set('key', 'value').get('key')).toBe('value');
  });

  it('should update a value in the event processor\'s state', () => {
    const mock = jest.fn((value: number) => value + 1);
    expect(new EventProcessor()
      .set('key', 0)
      .update('key', mock)
      .update('key', mock)
      .update('key', mock)
      .get('key'),
    ).toBe(3);

    expect(mock).toHaveBeenCalledTimes(3);
    expect(mock.mock.calls[0][0]).toEqual(0);
    expect(mock.mock.calls[1][0]).toEqual(1);
    expect(mock.mock.calls[2][0]).toEqual(2);
  });

  it('should delete a value from the event processor\'s state', () => {
    expect(new EventProcessor()
      .set('key', 'value')
      .delete('undef')
      .delete('key')
      .get('key'),
    ).toBe(undefined);
  });

  it('should apply middleware', () => {
    const mock = jest.fn((next) => { next(); });
    expect(new EventProcessor()
      .use(mock, mock)
      .use(mock)
      .use(mock, mock, mock)
      .dispatch(new Event('type')),
    );

    expect(mock).toHaveBeenCalledTimes(6);

    const initialConsoleError = console.error;
    console.error = jest.fn();

    // Test error cases
    const mock2 = jest.fn(() => { throw new Error(); });
    expect(new EventProcessor()
      .use(mock2, mock2)
      .dispatch(new Event('type')),
    );
    expect(mock2).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);

    const initialEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    expect(new EventProcessor()
      .use(mock2, mock2)
      .dispatch(new Event('type')),
    );
    expect(mock2).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledTimes(1);

    process.env.NODE_ENV = initialEnv;

    console.error = initialConsoleError;
  });

  it('should dispatch an event', () => {
    const event = new Event('type');

    const mock = jest.fn((next) => { next(); });
    expect(new EventProcessor().use(mock, mock).use(mock).dispatch(event, 'id'));

    const data = { event, args: ['id'] };
    expect(mock).toHaveBeenCalledTimes(3);
    expect(mock.mock.calls[0][1]).toEqual(data);
    expect(mock.mock.calls[0][2]).toBeInstanceOf(EventProcessor);
    expect(mock.mock.calls[1][1]).toEqual(data);
    expect(mock.mock.calls[1][2]).toBeInstanceOf(EventProcessor);
    expect(mock.mock.calls[2][1]).toEqual(data);
    expect(mock.mock.calls[2][2]).toBeInstanceOf(EventProcessor);
  });
});
