import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateCallsTable1742030400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'call',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'chatId',
            type: 'int',
          },
          {
            name: 'callerId',
            type: 'int',
          },
          {
            name: 'receiverId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'initiated',
              'ringing',
              'active',
              'ended',
              'missed',
              'rejected',
            ],
            default: "'initiated'",
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['voice', 'video'],
            default: "'voice'",
          },
          {
            name: 'sdpOffer',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sdpAnswer',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'iceCandidates',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'startedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'endedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'duration',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'call',
      new TableForeignKey({
        columnNames: ['chatId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'chat',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'call',
      new TableForeignKey({
        columnNames: ['callerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'call',
      new TableForeignKey({
        columnNames: ['receiverId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('call');
  }
}
