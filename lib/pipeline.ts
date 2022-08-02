import { Stack, StackProps, SecretValue } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Pipeline, Artifact } from "aws-cdk-lib/aws-codepipeline";
import { GitHubSourceAction, CodeBuildAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { PipelineProject, LinuxBuildImage, BuildSpec } from "aws-cdk-lib/aws-codebuild";

export class MyPipeline extends Stack {

  private readonly pipeline: Pipeline;
  private readonly cdkBuildOutput: Artifact;
  //private readonly serviceBuildOutput: Artifact;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    this.pipeline = new Pipeline(this, 'MyFirstPipeline', {
      pipelineName: 'MyPipeline',
      crossAccountKeys: false
    });

    const sourceOutput = new Artifact('SourceOutput');


    this.pipeline.addStage({
      stageName: 'Source',
      actions: [
        new GitHubSourceAction({
          owner: 'yomex4life',
          repo: 'aws-pipeline',
          branch: 'master',
          actionName: 'Pipeline_Source',
          oauthToken: SecretValue.secretsManager('github-pipeline-token'),
          output: sourceOutput
        })
      ]
    });

    this.cdkBuildOutput = new Artifact('cdkBuildOutput');

    this.pipeline.addStage({
      stageName: "Build",
      actions: [new CodeBuildAction({
        actionName: "CDK_build",
        input: sourceOutput,
        outputs: [this.cdkBuildOutput],
        project: new PipelineProject(this, 'CdkBuildProject', {
          environment: {
            buildImage: LinuxBuildImage.STANDARD_6_0
          },
          buildSpec:BuildSpec.fromSourceFilename('build-specs/cdk-build-spec.yml')
        })
      })]
    });
  }
}